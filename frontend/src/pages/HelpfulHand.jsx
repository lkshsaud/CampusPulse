import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/helpful-hand.css";

// marker icons
const ICONS = {
  lost: {
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  },
  found: {
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  },
  highlight: {
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  },
};

function makeIcon({ iconUrl, shadowUrl }) {
  return new L.Icon({
    iconUrl,
    shadowUrl,
    iconSize: [25,41],
    iconAnchor: [12,41],
    popupAnchor: [1,-34],
    shadowSize: [41,41],
  });
}

const lostIcon      = makeIcon(ICONS.lost);
const foundIcon     = makeIcon(ICONS.found);
const highlightIcon = makeIcon(ICONS.highlight);

// KU polygon
const KU_CENTER  = [27.6191,85.5394];
const KU_POLYGON = [
  [27.6165,85.5365],[27.6185,85.5425],[27.6205,85.5435],
  [27.6225,85.5415],[27.6230,85.5375],[27.6210,85.5345],
  [27.6190,85.5350],[27.6165,85.5365]
];

export default function HelpfulHand(){
  const mapRef       = useRef(null);
  const polyRef      = useRef(null);
  const clickMarker  = useRef(null);
  const markersRef   = useRef([]);
  const highlightRef = useRef(null);

  const [toast, setToast]               = useState("");
  const [locationInfo, setLocationInfo] = useState("No location selected");
  const [reports, setReports]           = useState([]);
  const [formData, setFormData]         = useState({
    itemName:"", category:"", description:"", image:null
  });
  const [filterVisible, setFilterVisible]   = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery]       = useState("");
  const [dateFilter, setDateFilter]         = useState("");
  const [currentLatLng, setCurrentLatLng]   = useState(null);

  const showToast = msg => {
    setToast(msg);
    setTimeout(()=>setToast(""),3000);
  };

  // initialize map
  useEffect(()=>{
    const map = L.map("map",{minZoom:16,maxZoom:19})
      .setView(KU_CENTER,16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
      attribution:"© OpenStreetMap"
    }).addTo(map);

    polyRef.current = L.polygon(KU_POLYGON,{
      color:"#0056b3", weight:2, fillOpacity:0
    }).addTo(map);

    map.on("click",e=>{
      if(!polyRef.current.getBounds().contains(e.latlng)){
        showToast("📍 Click inside KU campus");
        return;
      }
      setCurrentLatLng(e.latlng);
      setLocationInfo(`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
      if(clickMarker.current) clickMarker.current.setLatLng(e.latlng);
      else clickMarker.current = L.marker(e.latlng).addTo(map);
    });

    mapRef.current = map;
    loadReports();
    return ()=>map.remove();
  },[]);

  // load markers
  const loadReports = async ()=>{
    try {
      const {data} = await axios.get("/api/reports");
      setReports(data);
      renderMarkers(data);
    } catch {
      showToast("❌ Failed to load reports");
    }
  };

  const clearMarkers = ()=>{
    markersRef.current.forEach(m=>mapRef.current.removeLayer(m));
    markersRef.current = [];
  };

  const renderMarkers = list=>{
    clearMarkers();
    list.forEach(r=>{
      const icon = (r.category==="lost")?lostIcon:foundIcon;
      const m = L.marker([r.lat,r.lng],{icon})
        .bindPopup(`<b>${r.itemName}</b><br/><i>${r.category}</i><br/>${r.description}`)
        .addTo(mapRef.current);
      markersRef.current.push(m);
      r._marker = m;
    });
  };

  // filtered list
  const filtered = useMemo(()=>{
    let arr=[...reports];
    if(filterCategory!=="all") arr=arr.filter(r=>r.category===filterCategory);
    if(searchQuery) arr=arr.filter(r=>r.itemName.toLowerCase().includes(searchQuery.toLowerCase()));
    if(dateFilter==="newest") arr.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    if(dateFilter==="oldest") arr.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
    renderMarkers(arr);
    return arr;
  },[reports,filterCategory,searchQuery,dateFilter]);

  // form handlers
  const handleInput = e=>{
    const {id,value,files} = e.target;
    if(id==="image") setFormData(f=>({...f,image:files[0]}));
    else setFormData(f=>({...f,[id]:value}));
  };

  const handleSubmit = async e=>{
    e.preventDefault();
    if(!currentLatLng){ showToast("📍 Select location"); return; }
    const fd = new FormData();
    Object.entries(formData).forEach(([k,v])=>{
      if(k==="image"&&v) fd.append(k,v);
      else if(k!=="image") fd.append(k,v);
    });
    fd.append("lat",currentLatLng.lat);
    fd.append("lng",currentLatLng.lng);
    try {
      const {data} = await axios.post("/api/reports",fd,{
        headers:{"Content-Type":"multipart/form-data"}
      });
      setReports(r=>[data.report,...r]);
      setFormData({itemName:"",category:"",description:"",image:null});
      mapRef.current.removeLayer(clickMarker.current);
      clickMarker.current=null;
      setCurrentLatLng(null);
      setLocationInfo("No location selected");
      showToast("✅ Report submitted");
    } catch {
      showToast("❌ Failed to submit");
    }
  };

  const handleDelete = async id=>{
    if(!window.confirm("Claim this item?")) return;
    try {
      await axios.delete(`/api/reports/${id}`);
      setReports(r=>r.filter(x=>x._id!==id));
      showToast("🗑️ Report claimed");
    } catch {
      showToast("❌ Failed to delete");
    }
  };

  const focusReport = (lat,lng)=>{
    const rpt = reports.find(r=>r.lat===lat&&r.lng===lng);
    if(!rpt) return;
    if(highlightRef.current) highlightRef.current.setIcon(highlightRef.current.options.icon);
    rpt._marker.setIcon(highlightIcon);
    highlightRef.current = rpt._marker;
    mapRef.current.setView([lat,lng],18);
    rpt._marker.openPopup();
  };

  return (
    <div className="hh-wrapper">
      {toast && <div className="hh-toast">{toast}</div>}
      <header className="hh-header">
        <div className="hh-header__inner">
          <h1>HELPFUL‑HANDS KU CAMPUS</h1>
        </div>
      </header>

      <main className="hh-main">
        <div id="map" className="hh-map" />
        <aside className="hh-aside">
          <h2 className="section-title">Report Lost / Found</h2>
          <form className="hh-form" onSubmit={handleSubmit} encType="multipart/form-data">
            <label htmlFor="itemName">Item Name</label>
            <input id="itemName" value={formData.itemName}
              onChange={handleInput} required />

            <label htmlFor="category">Category</label>
            <select id="category" value={formData.category}
              onChange={handleInput} required>
              <option value="">— select —</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>

            <label htmlFor="description">Description</label>
            <textarea id="description" rows="3"
              value={formData.description}
              onChange={handleInput} required/>

            <label htmlFor="image">Image (optional)</label>
            <input id="image" type="file"
              accept="image/*" onChange={handleInput}/>

            <p className="location-info">📍 {locationInfo}</p>
            <button type="submit" className="btn-submit">Submit</button>
          </form>

          <div className="sidebar-bottom-spacer" />

          <hr/>

          <h2 className="section-title">Recent Reports</h2>
          <button onClick={()=>setFilterVisible(v=>!v)}
            className="btn-filter-toggle">
            {filterVisible ? "Hide Filters" : "Show Filters"}
          </button>

          {filterVisible && (
            <div className="hh-filters">
              <button onClick={()=>setFilterCategory("all")}>All</button>
              <button onClick={()=>setFilterCategory("lost")}>Lost</button>
              <button onClick={()=>setFilterCategory("found")}>Found</button>
              <input type="text" placeholder="Search…" value={searchQuery}
                onChange={e=>setSearchQuery(e.target.value)} />
              <select value={dateFilter}
                onChange={e=>setDateFilter(e.target.value)}>
                <option value="">Sort by Date</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          )}

          <div className="hh-reports-list">
            {filtered.length===0 && <p>No matching reports.</p>}
            {filtered.map(r=>(
              <article key={r._id} className="item-card">
                <h3>{r.itemName} <span className="tag">({r.category})</span></h3>
                <p>{r.description}</p>
                {r.imageUrl && <img src={r.imageUrl}
                  className="card-img" alt="report"/>}
                <p className="coords">📍 {r.lat.toFixed(5)}, {r.lng.toFixed(5)}</p>
                <div className="card-actions">
                  <button onClick={()=>focusReport(r.lat,r.lng)}>Show on Map</button>
                  <button onClick={()=>handleDelete(r._id)}>Claimed</button>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
