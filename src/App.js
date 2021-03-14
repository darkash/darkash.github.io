import './styles/App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  // Link
} from "react-router-dom";
import IDWSMigrator from './pages/idwsMIgrator';

function App() {
  // /**
  //  * @type { { name: string; path: string; }[] }
  //  */
  // const pages = [
  //   {
  //     name: 'Home',
  //     path: ''
  //   },
  //   {
  //     name: 'IDWS Migrator',
  //     path: 'idwsMigrator'
  //   },
  // ];
  return (
    <div className="App">
      <Router>
      <div>
        {/* <h1>Pages</h1>
        <nav>
          <ul>
            {pages.map((page) => {
              return (<li key={page.path}>
                <Link to={`/${page.path}`}>{page.name}</Link>
              </li>);
            })}
          </ul>
        </nav> */}

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route exact path="/">
            <IDWSMigrator />
          </Route>
        </Switch>
      </div>
    </Router>
    </div>
  );
}

export default App;
