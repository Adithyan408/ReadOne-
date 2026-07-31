import { Link } from "react-router-dom";

type Props = {
  onCreate: () => void;
};

function Navbar({ onCreate }: Props) {
  return (
    <nav>
      <button onClick={onCreate}>Create</button>

      <button>
        <Link to="/login">Login</Link>
      </button>
    </nav>
  );
}

export default Navbar;