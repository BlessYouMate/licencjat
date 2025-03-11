import { LoginPage } from '../LoginPage/src/LoginPage.jsx';
import { HomePage } from '../HomePage/src/HomePage.jsx';
import ErrorPage from './ErrorPage.jsx';

const routes = [
  {
    path: "login",
    element: <LoginPage />,
    
  },
  {
    path: "/",
    element: <HomePage />,
    errorElement: <ErrorPage />
  },
]

export default routes