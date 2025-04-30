import { LoginPage } from '../LoginPage/src/LoginPage.jsx';
import { HomePage } from '../HomePage/src/HomePage.jsx';
import { CalendarAndDutyPage } from '../CalendarAndDutyPage/src/CalendarAndDutyPage.jsx';
import { AdminPanel } from '../AdminPanel/src/AdminPanel.jsx';
import { AddingDuties } from '../AdminPanel/AdminFunctions/AddingDuties/src/AddingDuties.jsx';
import { ChangeDutyForm } from '../ChangeDutyForm/src/ChangeDutyForm.jsx';
import { TestOfAlgorithsm } from '../TestOfAlgorithms/src/TestOfAlgorithms.jsx';
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
  {
    path: "admin_panel",
    element: <AdminPanel />,
  },
  {
    path: "adding_duties",
    element: <AddingDuties />,
  },
  {
    path: "change_duty",
    element: <ChangeDutyForm />,
  },
  {
    path: "test_of_algorithms",
    element: <TestOfAlgorithsm />,
  },
]

export default routes