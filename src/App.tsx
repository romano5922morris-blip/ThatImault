import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import { SettingsProvider } from './lib/settings';
import Home from './pages/Home';
import Services from './pages/Services';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Reviews from './pages/Reviews';
import Quote from './pages/Quote';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

const Admin = lazy(() => import('./pages/admin/AdminApp'));

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Suspense fallback={<Loading />}><Admin /></Suspense>} />
      <Route element={<SettingsProvider><Layout /></SettingsProvider>}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="projets" element={<Projects />} />
        <Route path="projets/:slug" element={<ProjectDetail />} />
        <Route path="avis" element={<Reviews />} />
        <Route path="devis" element={<Quote />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
