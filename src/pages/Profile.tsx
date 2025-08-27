import React, { useState, useEffect } from 'react';
import { getCurrentUser, setCurrentUser, User } from '../services/authService';
import './Profile.css';

interface ProfileMeta {
	bio: string;
	company: string;
	location: string;
	website: string;
	fullName: string;
	interests: string[];
	avatarColor: string;
	socials: {
		linkedin: string;
		twitter: string;
		instagram: string;
		facebook: string;
	};
	notifications: {
		marketing: boolean;
		productUpdates: boolean;
		security: boolean;
		deals: boolean;
	};
	privacy: {
		showEmail: boolean;
		showStats: boolean;
		searchable: boolean;
	};
}

const META_KEY = 'profile_meta_v1';

const defaultMeta: ProfileMeta = {
	bio: 'Nieuwe ImpexDeals gebruiker. 📦',
	company: '',
	location: '',
	website: '',
	fullName: '',
	interests: ['import', 'export'],
	avatarColor: '#2b5f9f',
	socials: { linkedin:'', twitter:'', instagram:'', facebook:'' },
	notifications: { marketing: false, productUpdates: true, security: true, deals: true },
	privacy: { showEmail: false, showStats: true, searchable: true }
};

const loadMeta = (): ProfileMeta => {
	try { const raw = localStorage.getItem(META_KEY); if (raw) return { ...defaultMeta, ...JSON.parse(raw) }; } catch {}
	return defaultMeta;
};

const saveMeta = (m: ProfileMeta) => { try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch {} };

const tabs = [ 'Profiel', 'Instellingen', 'Privacy', 'Notificaties', 'Voorkeuren' ];

const Profile: React.FC = () => {
	const user = getCurrentUser();
	const [meta, setMeta] = useState<ProfileMeta>(loadMeta);
	const [activeTab, setActiveTab] = useState('Profiel');
	const [editingName, setEditingName] = useState(false);
	const [displayName, setDisplayName] = useState(user?.username || '');

	useEffect(()=> { saveMeta(meta); }, [meta]);

	if (!user) return <div className="profile-guard">Log in om je profiel te bekijken.</div>;

	const updateMeta = <K extends keyof ProfileMeta>(key: K, value: ProfileMeta[K]) => {
		setMeta(prev => ({ ...prev, [key]: value }));
	};

	const toggleInterest = (tag: string) => {
		setMeta(prev => prev.interests.includes(tag)
			? { ...prev, interests: prev.interests.filter(i => i !== tag) }
			: { ...prev, interests: [...prev.interests, tag] });
	};

	const commitName = () => {
		if (!displayName.trim()) return;
		const updated: User = { ...user, username: displayName.trim() };
		setCurrentUser(updated);
		setEditingName(false);
	};

	const colorChoices = ['#2b5f9f','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];
	const availableInterests = ['import','export','logistics','tech','ai','retail','wholesale','iot','blockchain'];

	return (
		<div className="profile-wrap">
			<div className="profile-hero">
			<div className="avatar" data-color={meta.avatarColor.replace('#','')}>{user.username.charAt(0).toUpperCase()}</div>
				<div className="info">
					{editingName ? (
						<div className="edit-inline">
							<input value={displayName} onChange={e=>setDisplayName(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') commitName(); if(e.key==='Escape'){ setEditingName(false); setDisplayName(user.username);} }} />
							<button onClick={commitName}>✔</button>
							<button onClick={()=>{ setEditingName(false); setDisplayName(user.username); }}>✕</button>
						</div>
					) : (
						<h1>{user.username} <button className="text-btn" onClick={()=>setEditingName(true)}>✏️</button></h1>
					)}
					<p className="bio">{meta.bio}</p>
					<div className="quick-stats">
						<div><span className="val">12</span><span className="label">Posts</span></div>
						<div><span className="val">1.2K</span><span className="label">Volgers</span></div>
						<div><span className="val">342</span><span className="label">Gevolgd</span></div>
						<div><span className="val">8.5%</span><span className="label">Engagement</span></div>
					</div>
					<div className="meta-line">
						{meta.company && <span>🏢 {meta.company}</span>}
						{meta.location && <span>📍 {meta.location}</span>}
						{meta.website && <span>🔗 <a href={meta.website} target="_blank" rel="noreferrer">Website</a></span>}
					</div>
				</div>
			</div>

			<div className="tabs">
				{tabs.map(t => <button key={t} className={t===activeTab? 'tab active':'tab'} onClick={()=>setActiveTab(t)}>{t}</button>)}
			</div>

			<div className="tab-body">
				{activeTab === 'Profiel' && (
					<div className="panel-grid">
						<section className="panel">
							<h3>Profielinformatie</h3>
										<label>Volledige naam<input value={meta.fullName} onChange={e=>updateMeta('fullName', e.target.value)} placeholder="Jouw naam" /></label>
							<label>Bio<textarea value={meta.bio} onChange={e=>updateMeta('bio', e.target.value)} rows={3} /></label>
										<label>Bedrijfsnaam<input value={meta.company} onChange={e=>updateMeta('company', e.target.value)} placeholder="Naam bedrijf" /></label>
							<label>Locatie<input value={meta.location} onChange={e=>updateMeta('location', e.target.value)} /></label>
							<label>Website<input value={meta.website} onChange={e=>updateMeta('website', e.target.value)} placeholder="https://" /></label>
							<div className="color-row">
								<span className="lbl">Avatar kleur</span>
								<div className="swatches">
														{colorChoices.map(c => (
															<button key={c} aria-label={`Kies kleur ${c}`} title={`Kies kleur ${c}`} className={c===meta.avatarColor? 'swatch active':'swatch'} data-color={c.replace('#','')} onClick={()=>updateMeta('avatarColor', c)} />
														))}
								</div>
							</div>
										<h4>Social Media</h4>
										<div className="social-grid">
											<label>LinkedIn<input value={meta.socials.linkedin} onChange={e=>updateMeta('socials', { ...meta.socials, linkedin:e.target.value })} placeholder="https://linkedin.com/in/..." /></label>
											<label>X / Twitter<input value={meta.socials.twitter} onChange={e=>updateMeta('socials', { ...meta.socials, twitter:e.target.value })} placeholder="https://x.com/..." /></label>
											<label>Instagram<input value={meta.socials.instagram} onChange={e=>updateMeta('socials', { ...meta.socials, instagram:e.target.value })} placeholder="https://instagram.com/..." /></label>
											<label>Facebook<input value={meta.socials.facebook} onChange={e=>updateMeta('socials', { ...meta.socials, facebook:e.target.value })} placeholder="https://facebook.com/..." /></label>
										</div>
						</section>
						<section className="panel">
							<h3>Interesses</h3>
							<div className="chips">
								{availableInterests.map(i => (
									<button key={i} onClick={()=>toggleInterest(i)} className={meta.interests.includes(i)?'chip on':'chip'}>{i}</button>
								))}
							</div>
							<p className="hint">Klik om interesses toe te voegen of te verwijderen. Deze worden gebruikt voor aanbevelingen.</p>
						</section>
					</div>
				)}
				{activeTab === 'Instellingen' && (
					<div className="panel">
						<h3>Account</h3>
						<div className="setting-row">
							<span>Rol</span>
							<span className={`role-badge ${user.role}`}>{user.role}</span>
						</div>
						<div className="setting-row"><span>Email</span><span>{user.email}</span></div>
						<div className="setting-row"><span>Kan uploaden</span><span className={user.canUpload? 'pill yes':'pill no'}>{user.canUpload? 'Ja':'Nee'}</span></div>
						<div className="divider" />
						<h4>Verificatie</h4>
						<div className="setting-row"><span>2FA</span><button className="pill-btn tiny" disabled>Binnenkort</button></div>
						<div className="setting-row"><span>API Keys</span><button className="pill-btn tiny" disabled>Beheren</button></div>
					</div>
				)}
				{activeTab === 'Privacy' && (
					<div className="panel">
						<h3>Privacy Controle</h3>
						<label className="toggle"><input type="checkbox" checked={meta.privacy.showEmail} onChange={e=>updateMeta('privacy', { ...meta.privacy, showEmail:e.target.checked })}/> Toon mijn e-mail openbaar</label>
						<label className="toggle"><input type="checkbox" checked={meta.privacy.showStats} onChange={e=>updateMeta('privacy', { ...meta.privacy, showStats:e.target.checked })}/> Toon statistieken op profiel</label>
						<label className="toggle"><input type="checkbox" checked={meta.privacy.searchable} onChange={e=>updateMeta('privacy', { ...meta.privacy, searchable:e.target.checked })}/> Profiel vindbaar via zoeken</label>
						<p className="hint">Pas aan hoe anderen jouw gegevens zien.</p>
					</div>
				)}
				{activeTab === 'Notificaties' && (
					<div className="panel">
						<h3>Notificaties</h3>
						<label className="toggle"><input type="checkbox" checked={meta.notifications.productUpdates} onChange={e=>updateMeta('notifications', { ...meta.notifications, productUpdates:e.target.checked })}/> Product updates</label>
						<label className="toggle"><input type="checkbox" checked={meta.notifications.deals} onChange={e=>updateMeta('notifications', { ...meta.notifications, deals:e.target.checked })}/> Nieuwe deals & partijen</label>
						<label className="toggle"><input type="checkbox" checked={meta.notifications.security} onChange={e=>updateMeta('notifications', { ...meta.notifications, security:e.target.checked })}/> Beveiligingsmeldingen</label>
						<label className="toggle"><input type="checkbox" checked={meta.notifications.marketing} onChange={e=>updateMeta('notifications', { ...meta.notifications, marketing:e.target.checked })}/> Marketing & nieuwsbrieven</label>
						<p className="hint">Schakel bepaalde e-mails en pushmeldingen in of uit.</p>
					</div>
				)}
				{activeTab === 'Voorkeuren' && (
					<div className="panel">
						<h3>Platform Voorkeuren</h3>
						<div className="setting-row between"><label className="sel-label">Interface thema<select disabled aria-label="Interface thema" title="Interface thema"><option>Light</option><option>Dark</option></select></label></div>
						<div className="setting-row between"><label className="sel-label">Taal<select disabled aria-label="Taal" title="Taal"><option>Nederlands</option><option>English</option></select></label></div>
						<div className="setting-row between"><label className="sel-label">Tijdzone<select disabled aria-label="Tijdzone" title="Tijdzone"><option>Automatisch</option></select></label></div>
						<p className="hint">Meer personalisatie komt later.</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Profile;
