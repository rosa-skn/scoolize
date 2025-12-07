import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      nav("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-300 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Parcoursup Logo */}
            <div>
              <h1 className="text-2xl font-bold text-[#5C2D91]">Parcoursup</h1>
              <p className="text-xs text-gray-600">La plateforme d'admission dans le supérieur</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-black mb-4">
            Connexion à votre espace candidat
          </h2>

          <p className="text-sm text-gray-600 mb-8 italic">
            Tous les champs sont obligatoires.
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Votre adresse email
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Exemple : nom.prenom@exemple.com
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded focus:outline-none focus:border-blue-600 bg-blue-50"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Votre mot de passe
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-400 rounded focus:outline-none focus:border-blue-600 bg-blue-50"
                required
              />
            </div>

            {/* Show Password Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="showPassword" className="text-sm text-black">
                Afficher
              </label>
            </div>

            {/* Forgot Password Link */}
            <div>
              <button
                type="button"
                className="text-sm text-blue-700 underline hover:no-underline"
              >
                Identifiant(s) oublié(s) ?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#000091] text-white font-semibold rounded hover:bg-[#000070] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 pt-6 border-t border-gray-300">
            <Link
              to="/register"
              className="text-blue-700 underline hover:no-underline font-semibold"
            >
              Vous n'avez pas de compte ? Créez-en un →
            </Link>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-gray-50 border border-gray-300 rounded p-6">
            <p className="text-sm text-gray-700 mb-4">
              <strong>Important</strong>, pour créer un compte sur Parcoursup, vous devez
              renseigner une <strong>adresse mail personnelle</strong>, à laquelle vous
              aurez accès tout le long de la procédure.
            </p>
            <p className="text-sm text-gray-700 mb-4">
              Si vous êtes lycéen, vous devez créer votre compte Parcoursup en utilisant
              l'adresse mail que vous avez transmise à votre lycée. En cas de doute,
              contactez la scolarité de votre établissement.
            </p>
            <p className="text-sm text-gray-700">
              Si vous aviez déjà un compte Parcoursup l'an dernier, vos anciens
              identifiants (mail et mot de passe) sont toujours valables et doivent être
              utilisés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
