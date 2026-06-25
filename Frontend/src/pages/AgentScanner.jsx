import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Html5Qrcode } from 'html5-qrcode';

export default function AgentScanner() {
  const [erreur, setErreur] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // QR code scanné avec succès
        scanner.stop();

        // Extrait le code de suivi depuis l'URL
        const match = decodedText.match(/\/suivi\/(DGS-\d{4}-\d{6})/);
        if (match) {
          const codeSuivi = match[1];
          // Redirige vers la recherche du colis par code de suivi
          navigate(`/agent/colis?recherche=${codeSuivi}`);
        } else {
          setErreur('QR code non reconnu. Assurez-vous de scanner un colis DGS Track.');
          scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            () => {},
            () => {}
          );
        }
      },
      () => {} // erreur de scan silencieuse
    ).then(() => {
      setScanning(true);
    }).catch((err) => {
      setErreur('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <Layout>
      <Link to="/agent/colis" className="text-slate-300 text-sm hover:text-white">
        ← Retour à la liste
      </Link>

      <h2 className="text-xl sm:text-2xl font-bold text-white mt-3">Scanner un colis</h2>
      <p className="text-slate-300 mt-1 text-sm">
        Pointez la caméra vers le QR code du colis pour accéder directement à sa fiche.
      </p>

      <div className="bg-white rounded-xl p-6 mt-6 max-w-md mx-auto">
        {erreur && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {erreur}
          </div>
        )}

        <div
          id="qr-reader"
          className="w-full rounded-xl overflow-hidden"
        />

        {!scanning && !erreur && (
          <p className="text-slate-400 text-sm text-center mt-4">
            Initialisation de la caméra...
          </p>
        )}

        {scanning && (
          <p className="text-slate-500 text-sm text-center mt-4">
            📷 Caméra active — scannez le QR code du colis
          </p>
        )}
      </div>
    </Layout>
  );
}