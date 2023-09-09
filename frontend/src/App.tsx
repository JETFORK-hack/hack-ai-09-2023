
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header/Header';
import { CartChecking } from './pages/CartChecking';
import { Products } from './pages/Products';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Header />}>
          <Route path='' element={<CartChecking />} />
          <Route path='cart' element={<CartChecking />} />
          <Route path='cart/:id' element={<CartChecking />} />
          <Route path='products' element={<Products />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
