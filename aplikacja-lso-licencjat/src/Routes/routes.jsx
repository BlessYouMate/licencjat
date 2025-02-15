import { LoginPage } from '../LoginPage/src/LoginPage';
import { HomePage } from '../HomePage/src/HomePage';
import ErrorPage from './ErrorPage';

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