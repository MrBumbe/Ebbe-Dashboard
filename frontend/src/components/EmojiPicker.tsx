import { useState, useRef, useEffect } from 'react';

// ~200 emojis grouped by category
const EMOJI_CATEGORIES = [
  {
    label: 'Faces',
    icon: '😊',
    emojis: ['😀','😄','😊','😍','🥰','😎','🤩','😴','😡','😢','😔','😰','🤔','😮','🤗','😂','🙄','😅','🥳','🤯','😱','🤪','😇','🤭','😬','🥺','😤','🫠','🙂','😏'],
  },
  {
    label: 'People',
    icon: '🧒',
    emojis: ['🧒','👦','👧','🧑','👩','👨','🧓','👴','👵','👶','🧑‍🎓','👩‍💻','🧑‍🏫','🧑‍🍳','🧑‍🎨','🧑‍🚒','🧑‍⚕️','🦸','🦹','🧙','👸','🤴','💂','👮'],
  },
  {
    label: 'Activities',
    icon: '⚽',
    emojis: ['⚽','🏀','🎮','🎨','📚','🎵','🎭','🏊','🚴','⛷️','🎯','🎲','🧩','🎤','🎸','🏋️','🤸','🧘','🎻','🎹','🎺','🎳','🏓','🏸','⛸️','🏒','🥊','🎣'],
  },
  {
    label: 'Food',
    icon: '🍎',
    emojis: ['🍎','🍕','🍔','🍦','🍰','🎂','🥗','🍜','🥐','🥤','☕','🍪','🍓','🍊','🥝','🍩','🍫','🍿','🥞','🧇','🥨','🌮','🌯','🥙','🍣','🍱','🧁','🍭','🥛','🫐'],
  },
  {
    label: 'Animals',
    icon: '🐶',
    emojis: ['🐶','🐱','🐭','🐻','🐨','🐯','🦁','🐘','🦒','🐬','🐦','🦋','🐢','🐠','🐈','🐕','🦊','🐺','🦝','🐸','🐊','🐧','🦉','🦆','🐝','🦄','🐲','🦋','🐙','🦑'],
  },
  {
    label: 'Places',
    icon: '🏠',
    emojis: ['🏠','🏫','🚗','🚌','✈️','🚀','🌊','🏖️','⛰️','🎡','🏕️','🚂','🚁','🌆','🏙️','🌉','🎢','🏰','⛪','🏟️','🌄','🏝️','🗺️','🗼','🚢','🛸','🎠','🌋'],
  },
  {
    label: 'Objects',
    icon: '⭐',
    emojis: ['⭐','🌟','💫','✨','🎈','🎁','🎀','🎊','🎉','🏆','🎗️','📱','💻','🎒','👑','💡','🔦','📷','🎬','📺','📻','🧸','🪆','🛁','🪴','🧲','💎','🔮','🧪','🪄'],
  },
  {
    label: 'Nature',
    icon: '🌸',
    emojis: ['🌸','🌺','🌻','🌙','🌈','❄️','🌊','🍀','🌲','🌴','🌞','⛅','🌧️','🌪️','🌍','🌕','⭐','☄️','🌵','🍁','🍂','🌾','🌿','🌱','🏵️','🪻','🫧','🌨️','⚡','🌬️'],
  },
] as const;

interface Props {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export default function EmojiPicker({ value, onChange, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function pick(emoji: string) {
    onChange(emoji);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-10 text-xl border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center select-none"
        title="Choose emoji"
      >
        {value || '😊'}
      </button>

      {open && (
        <div className="absolute z-50 top-11 left-0 w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Category tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveCategory(i)}
                title={cat.label}
                className={`flex-shrink-0 px-2.5 py-2 text-base transition-colors ${activeCategory === i ? 'bg-blue-50 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`}
              >
                {cat.icon}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="p-2 grid grid-cols-8 gap-0.5 max-h-52 overflow-y-auto">
            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => pick(emoji)}
                className="text-xl p-1.5 rounded hover:bg-blue-50 active:bg-blue-100 transition-colors leading-none"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
