import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [redirect, setRedirect] = useState(false);

  const onSubmit = async (data) => {
    try {
      const res = await axios.post("/api/auth/register", data, {withCredentials: true});

      if (res.status === 201) {
        // redirect to homepage
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setRedirect(true);
    }
  };

  if (redirect) {
    window.location.href = "/";
    return null;
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input {...register("name", { required: true })} placeholder="Name" className="peer block w-full bg-lime-50 px-3 py-1.5 text-gray-900 placeholder-gray-500 focus:outline-none sm:text-sm" />
        {errors.name?.message && errors.name.message}

        <input
          {...register("email", {
            required: true,
            pattern: { value: /^\S+@\S+$/, message: "Invalid email format" },
          })}
          placeholder="Email"
          className="mt-3 peer block w-full bg-lime-50 px-3 py-1.5 text-gray-900 placeholder-gray-500 focus:outline-none sm:text-sm"
        />
        {errors.email?.message && errors.email.message}

        <input
          {...register("password", {
            required: true,
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
          placeholder="Password"
          className="mt-3 peer block w-full bg-lime-50 px-3 py-1.5 text-gray-900 placeholder-gray-500 focus:outline-none sm:text-sm"
        />
        {errors.password?.message && errors.password.message}
        <button type="submit" className="mt-2 w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-500">Register</button>
      </form>
    </div>
  );
}
