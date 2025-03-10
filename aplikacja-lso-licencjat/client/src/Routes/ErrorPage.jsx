import { Link } from "react-router-dom";

const ErrorPage = () => {
  return (
    <div>
      <h1>O nie! Ta strona nie istnieje!</h1>
      <Link to="/">
        Ale możesz wrócić na stronę główną klikając tu!
      </Link>
    </div>
  );
};

export default ErrorPage;
