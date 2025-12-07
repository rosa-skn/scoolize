import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      alert("Compte créé avec succès ! Veuillez vérifier votre email.");
      nav("/");
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-300 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#5C2D91]">Parcoursup</h1>
              <p className="text-xs text-gray-600">La plateforme d'admission dans le supérieur</p>
            </div>
          </div>

        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
    

        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-black mb-4">
            Créer votre espace candidat
          </h2>

          <p className="text-sm text-gray-600 mb-8 italic">
            Tous les champs sont obligatoires.
          </p>

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Votre adresse email personnelle
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Exemple : nom.prenom@exemple.com
              </p>
              <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded p-3 mb-2">
                ⚠️ Attention : utilisez une adresse email que vous consultez régulièrement.
                Vous recevrez toutes les informations importantes à cette adresse.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded focus:outline-none focus:border-blue-600 bg-blue-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Créer un mot de passe
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Minimum 6 caractères
              </p>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded focus:outline-none focus:border-blue-600 bg-blue-50"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded focus:outline-none focus:border-blue-600 bg-blue-50"
                required
                minLength={6}
              />
            </div>


            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="showPassword" className="text-sm text-black">
                Afficher les mots de passe
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#000091] text-white font-semibold rounded hover:bg-[#000070] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Création du compte..." : "Créer mon compte"}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-8 pt-6 border-t border-gray-300">
            <Link
              to="/"
              className="text-blue-700 underline hover:no-underline font-semibold"
            >
              ← Retour à la connexion
            </Link>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded p-6">
            <p className="text-sm text-gray-700 mb-4">
              <strong>💡 Conseils pour votre mot de passe :</strong>
            </p>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>Utilisez au moins 6 caractères</li>
              <li>Mélangez lettres, chiffres et caractères spéciaux</li>
              <li>Ne partagez jamais votre mot de passe</li>
              <li>Conservez-le dans un endroit sûr</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
