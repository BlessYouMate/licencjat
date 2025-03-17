import { LoginPage } from '../LoginPage/src/LoginPage.jsx';
import { HomePage } from '../HomePage/src/HomePage.jsx';
import { CalendarAndDutyPage } from '../CalendarAndDutyPage/src/CalendarAndDutyPage.jsx';
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
  {
    path: "duty",
    element: <CalendarAndDutyPage />,
    
  },
]

export default routes