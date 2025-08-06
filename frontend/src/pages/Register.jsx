import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const testimonials = [
  {
    name: "Rakesh Sharma",
    title: "Bachelor Student",
    image: "/testimonial1.png",
    text: `This platform is very helpful for university students. it has helped me in alot of scenarios. `,
  },
  {
    name: "Lisa Johnson",
    title: "Master's Student",
    image: "/testimonial1.png",
    text: `Once i lost my important certificate and this platform helped me to get it back.`,
  },
];

const Register = () => {
  const [index, setIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [file, setFile] = useState("");
  const [filePrev, setFilePrev] = useState("");

  const { registerUser, loading } = UserData();
  const { fetchPosts } = PostData();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const changeFileHandler = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setFilePrev(reader.result);
      setFile(file);
    };
  };

  const submitHandler = (e) => {
    e.preventDefault();
    const formdata = new FormData();
    formdata.append("name", name);
    formdata.append("email", email);
    formdata.append("password", password);
    formdata.append("gender", gender);
    formdata.append("file", file);
    registerUser(formdata, navigate, fetchPosts);
  };

  return (
    <>
      {loading ? (
        <h1>Loading....</h1>
      ) : (
        <div className="min-h-screen bg-gradient-to-r from-[#fff1eb] to-[#ace0f9] flex items-center justify-center">
          <div className="flex flex-col md:flex-row rounded-[30px] overflow-hidden shadow-2xl max-w-6xl w-full bg-white">
            {/* Left Side */}
            <div className="md:w-1/2 bg-[#1c1c1c] text-white flex flex-col items-center justify-center p-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold">Engage with the University circle</h2>
                <p className="text-gray-400 text-sm mt-2">
                  Get connected with the students around your university and manage your accessories
                </p>
              </div>

              <div className="mt-8 w-full flex flex-col items-center">
                <div className="bg-[#2a2a2a] p-6 rounded-2xl max-w-sm text-center transition-all duration-500 ease-in-out">
                  <p className="mb-4 text-sm">{testimonials[index].text}</p>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <img
                      src={testimonials[index].image}
                      alt={testimonials[index].name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold">{testimonials[index].name}</p>
                      <p className="text-xs text-gray-400">{testimonials[index].title}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  {testimonials.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setIndex(i)}
                      className={`w-2 h-2 rounded-full cursor-pointer ${
                        index === i ? "bg-white" : "bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="md:w-1/2 p-10 flex flex-col justify-center items-center">
              <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>
              <form onSubmit={submitHandler} className="space-y-4 w-full max-w-sm">
                {filePrev && (
                  <div className="flex justify-center">
                    <img
                      src={filePrev}
                      className="w-28 h-28 rounded-full object-cover"
                      alt="profile"
                    />
                  </div>
                )}
                <div className="w-full  flex  justify-center">
                <input
                  type="file"
                  onChange={changeFileHandler}
                  accept="image/*"
                  required
                  className="block mx-auto"
                />
                </div>
                <input
                  type="text"
                  placeholder="User Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-full text-center"
                />
                <input
                  type="email"
                  placeholder="User Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-full text-center"
                />
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="User Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-full text-center pr-10"
                  />
                  <div
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    className="absolute right-4 top-3 cursor-pointer text-gray-500"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </div>
                </div>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-full text-center"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <button className="bg-orange-500 text-white px-6 py-2 rounded-full w-full hover:bg-orange-600">
                  Register
                </button>
                <p className="text-sm text-center mt-2">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-500 underline">
                    Log in
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Register;
