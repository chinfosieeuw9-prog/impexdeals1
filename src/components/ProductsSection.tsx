import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ProductCard from './ProductCard';

const products = [
  {
    title: 'Smartphone partij',
    price: '€6.126',
    label: 'REDELIJK',
    image: 'https://via.placeholder.com/220x140?text=Smartphone',
  },
  {
    title: 'Winkelwagen',
    price: '€400',
    label: 'ALS NIEUW',
    image: 'https://via.placeholder.com/220x140?text=Winkelwagen',
  },
  {
    title: 'Laptop partij',
    price: '€11',
    label: 'GOED',
    image: 'https://via.placeholder.com/220x140?text=Laptop',
  },
];

const ProductsSection: React.FC = () => (
  <Box sx={{ mt: 6 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Nieuwste Producten
      </Typography>
      <Button variant="outlined" color="primary" sx={{ borderRadius: 8 }}>
        Alle producten
      </Button>
    </Box>
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {products.map((p, i) => (
        <ProductCard key={i} {...p} />
      ))}
    </Box>
  </Box>
);

export default ProductsSection;
