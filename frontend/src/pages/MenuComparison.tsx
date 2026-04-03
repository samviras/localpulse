import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coffee, UtensilsCrossed, Droplet, Star } from 'lucide-react';
import { apiClient } from '../api';

interface MenuItem {
  id: number;
  item_name: string;
  category: string;
  competitor_name: string;
  competitor_id: number;
  price?: number;
  review_count: number;
  sentiment_score?: number;
  source: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  coffee: '☕',
  cold_coffee: '🧊',
  tea: '🫖',
  pastry: '🥐',
  food: '🍲',
  beverage: '🥤',
};

export default function MenuComparison() {
  const [searchParams] = useSearchParams();
  const locationId = parseInt(searchParams.get('location') || '1');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiClient.getMenuComparison(locationId);
        setMenuItems(response.top_items || []);
      } catch (e) {
        console.error('Error loading menus:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [locationId]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading menu data...</div>;
  }

  const categories = Array.from(new Set(menuItems.map(m => m.category)));
  const filteredItems = selectedCategory ? menuItems.filter(m => m.category === selectedCategory) : menuItems;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Menu Comparison</h2>
        <p className="text-gray-400 text-sm">See what your competitors are serving and what customers love</p>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All ({menuItems.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{CATEGORY_ICONS[cat] || '🍽️'}</span>
              {cat.replace('_', ' ')} ({menuItems.filter(m => m.category === cat).length})
            </button>
          ))}
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <div key={item.id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 hover:border-gray-600 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-white font-semibold flex items-center gap-2 mb-1">
                    <span>{CATEGORY_ICONS[item.category] || '🍽️'}</span>
                    {item.item_name}
                  </h4>
                  <p className="text-sm text-gray-400">{item.competitor_name}</p>
                </div>
                {item.sentiment_score && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-400">★ {item.sentiment_score.toFixed(1)}</div>
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-3 pt-3 border-t border-gray-700/30">
                {item.review_count > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Reviews mentioning this</span>
                    <span className="text-green-400 font-semibold">{item.review_count} 👍</span>
                  </div>
                )}
                {item.price && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Typical Price</span>
                    <span className="text-blue-400 font-semibold">${item.price.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Source</span>
                  <span className="text-gray-300 text-xs px-2 py-1 bg-gray-700/50 rounded">{item.source}</span>
                </div>
              </div>

              <button className="w-full mt-4 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-sm font-medium py-2 rounded transition-colors">
                ➕ Add to my menu
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No menu data found. Competitors may not have public menus available yet.</p>
            <p className="text-sm mt-2">Try refreshing competitor data...</p>
          </div>
        )}
      </div>

      {/* Action Items */}
      {menuItems.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>💡</span> Top Opportunities
          </h3>
          <ul className="space-y-2">
            {filteredItems.slice(0, 3).map((item, i) => (
              <li key={i} className="text-gray-300 text-sm flex items-start gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>
                  Add <strong>{item.item_name}</strong> to your menu • {item.competitor_name} has {item.review_count} reviews on this
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
