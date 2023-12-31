
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header/Header';
import { CartChecking } from './pages/CartChecking';
import { Products } from './pages/Products';
import { ConfigProvider, theme } from 'antd';
import { ProductsWithDevice } from './pages/ProductsWithDevice';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            colorPrimary: '#00b96b',
          },
          Input: {
            colorPrimary: '#eb2f96',
          },
          Menu: {
            // colorPrimary: '#eb2f96',
            colorPrimary: '#fa8c16',
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Header />}>
            <Route path='' element={<CartChecking />} />
            <Route path='cart' element={<CartChecking />} />
            <Route path='cart/:id' element={<CartChecking />} />
            <Route path='products' element={<Products />} />
            <Route path='products/:selectedType/:deviceId' element={<ProductsWithDevice />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}
