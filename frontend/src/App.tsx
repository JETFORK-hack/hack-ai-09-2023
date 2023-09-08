
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header/Header';
import { Loading } from './pages/Loading';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Header />}>
          <Route path='' element={<Loading />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
