import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";

const HomePage = () => <div className="p-8">Home</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },
]);
