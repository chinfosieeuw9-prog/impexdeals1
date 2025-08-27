import React from 'react';
import { getCurrentUser } from '../services/authService';
import { Link } from 'react-router-dom';
import './Home.css';
import EnhancedProductCard from '../components/EnhancedProductCard';

interface Product { id:number; naam:string; verkoper:string; aantal:number; categorie:string; prijs:number; conditie:'NIEUW'|'ALS NIEUW'|'GOED'|'REDELIJK'; img:string; link:string; }

const producten: Product[] = [
	{ id:1, naam:'Express Lot Phones', verkoper:'Trader NL', aantal:10, categorie:'Elektronica', prijs:6126, conditie:'REDELIJK', img:'/logo192.png', link:'/product/1' },
	{ id:2, naam:'Partij Barbecues', verkoper:'BBQ Import', aantal:5, categorie:'Tuin', prijs:400, conditie:'ALS NIEUW', img:'/logo192.png', link:'/product/2' },
	{ id:3, naam:'Gadget Mix', verkoper:'Tech Bulk', aantal:25, categorie:'Elektronica', prijs:11, conditie:'GOED', img:'/logo192.png', link:'/product/3' },
	{ id:4, naam:'Partij Laptops', verkoper:'Refurb Pro', aantal:14, categorie:'IT', prijs:950, conditie:'NIEUW', img:'/logo192.png', link:'/product/4' },
];


const Home: React.FC = () => {
	const user = getCurrentUser();
	return (
		<main className="home-root">
			<section className="hero">
				<div className="hero-inner">
					<h1 className="hero-title">Welkom bij ImpexDeals</h1>
					<p className="hero-sub">Uw platform voor de handel in partijen goederen. Koop en verkoop efficiënt met onze catalogus functionaliteit.</p>
					<div className="hero-buttons">
						{!user && <Link to="/register" className="btn btn-secondary"><span className="icon-bolt">⚡</span> Aan de slag</Link>}
						<Link to="/partijen" className="btn btn-primary">🔍 Catalogus bekijken</Link>
					</div>
					<div className="hero-stats">
						<div><span>10+</span><small>Actieve Producten</small></div>
						<div><span>24/7</span><small>Online Beschikbaar</small></div>
						<div><span>100%</span><small>Veilig Handelen</small></div>
					</div>
				</div>
			</section>

			<section className="products-section">
				<div className="section-head">
					<h2 className="section-title">🔗 Nieuwste Producten</h2>
					<Link to="/partijen" className="outline-btn">→ Alle producten</Link>
				</div>
				<div className="home-product-grid">
					{producten.map(p => (
						<EnhancedProductCard imageRatio="16/9" compact key={p.id} id={String(p.id)} title={p.naam} price={p.prijs} image={p.img} qty={p.aantal} category={p.categorie} condition={p.conditie} />
					))}
				</div>
			</section>

			{/* Globale footer staat in App.tsx */}
		</main>
	);
};

export default Home;
