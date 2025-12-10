import React from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowLeft, BarChart } from 'lucide-react';

export default function Comparator({ comparatorList, toggleComparator, clearComparator }) { 
    
    const comparisonFields = [
        { key: 'lib_for_voe_ins', label: 'Nom de la Formation' },
        { key: 'ville_etab', label: 'Ville' },
        { key: 'lib_dep', label: 'Département' },
        { key: 'contrat_etab', label: 'Type d\'établissement' },
        { key: 'fili', label: 'Filière' },
        { key: 'taux_acces_form', label: 'Taux d\'accès (en %)' },
        { key: 'capacite', label: 'Capacité d\'accueil' },
        { key: 'pct_bours_prop', label: 'Prop. de boursiers acceptés (en %)' },
    ];

    if (comparatorList.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-10">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart className="w-8 h-8 text-blue-900" />
                    Votre comparateur est vide
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                    Sélectionnez jusqu'à 3 formations depuis le tableau de bord pour les comparer.
                </p>
                <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Retourner au tableau de bord
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-6 md:p-10">
            <div className="max-w-screen-2xl mx-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-3xl font-bold text-black">
                        Comparaison de formations ({comparatorList.length})
                    </h1>
                    <div className="flex gap-4">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 px-4 py-2 text-blue-900 border border-blue-900 rounded hover:bg-blue-50 transition-colors text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Retour à la recherche
                        </Link>
                        <button
                            onClick={clearComparator}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                        >
                            <X className="w-4 h-4" />
                            Vider la liste
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto shadow-lg rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                                    Critère de comparaison
                                </th>
                               
                                {comparatorList.map(formation => (
                                    <th key={formation.recordid} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase relative border-l border-gray-200">
                                     
                                        <button 
                                            onClick={() => toggleComparator(formation)}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                                            title="Retirer du comparateur"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="mt-4 font-bold text-gray-900 text-sm whitespace-normal">
                                            {formation.fields.lib_for_voe_ins}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {formation.fields.ville_etab}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          
                            {comparisonFields.map(field => (
                                <tr key={field.key} className="hover:bg-gray-50">
                                    
                                    <td className="px-6 py-4 whitespace-normal text-sm font-semibold text-gray-900 bg-gray-50 w-48 sticky left-0 z-10 border-r border-gray-200">
                                        {field.label}
                                    </td>
                                 
                                    {comparatorList.map(formation => (
                                        <td key={`${formation.recordid}-${field.key}`} className="px-6 py-4 text-sm text-gray-700 text-center align-top border-l border-gray-100">
                                          
                                            {formation.fields[field.key] || '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}