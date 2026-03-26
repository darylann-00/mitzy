export function BottomNav({ view, setView }) {
  const activeTab = view;

  const TodayIcon = () => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <polygon
        points="11,1 13.5,8.5 21,8.5 15,13.5 17,21 11,16.5 5,21 7,13.5 1,8.5 8.5,8.5"
        fill={activeTab === 'home' ? '#F4C430' : '#4A6256'}
        opacity={activeTab === 'home' ? 1 : 0.5}
      />
    </svg>
  );

  const AllIcon = () => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="6"  cy="6"  r="3.5" fill="#D62828" opacity={activeTab === 'all' ? 1 : 0.4} />
      <circle cx="16" cy="6"  r="3.5" fill="#F77F00" opacity={activeTab === 'all' ? 1 : 0.4} />
      <circle cx="6"  cy="16" r="3.5" fill="#06A77D" opacity={activeTab === 'all' ? 1 : 0.4} />
      <circle cx="16" cy="16" r="3.5" fill="#F4C430" opacity={activeTab === 'all' ? 1 : 0.4} />
    </svg>
  );

  const ProfileIcon = () => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="5" r="3"
        fill={activeTab === 'you' ? '#06A77D' : '#4A6256'}
        opacity={activeTab === 'you' ? 1 : 0.5} />
      <line x1="11" y1="8"  x2="11" y2="15" stroke={activeTab === 'you' ? '#06A77D' : '#4A6256'} strokeWidth="2.5" strokeLinecap="round" opacity={activeTab === 'you' ? 1 : 0.5} />
      <line x1="11" y1="10" x2="5"  y2="8"  stroke={activeTab === 'you' ? '#06A77D' : '#4A6256'} strokeWidth="2.5" strokeLinecap="round" opacity={activeTab === 'you' ? 1 : 0.5} />
      <line x1="11" y1="10" x2="17" y2="8"  stroke={activeTab === 'you' ? '#06A77D' : '#4A6256'} strokeWidth="2.5" strokeLinecap="round" opacity={activeTab === 'you' ? 1 : 0.5} />
      <line x1="11" y1="15" x2="7"  y2="21" stroke={activeTab === 'you' ? '#06A77D' : '#4A6256'} strokeWidth="2.5" strokeLinecap="round" opacity={activeTab === 'you' ? 1 : 0.5} />
      <line x1="11" y1="15" x2="15" y2="21" stroke={activeTab === 'you' ? '#06A77D' : '#4A6256'} strokeWidth="2.5" strokeLinecap="round" opacity={activeTab === 'you' ? 1 : 0.5} />
    </svg>
  );

  const TABS = [
    { id: 'home', label: 'Today',   Icon: TodayIcon   },
    { id: 'all',  label: 'All',     Icon: AllIcon     },
    { id: 'you',  label: 'Profile', Icon: ProfileIcon },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      background: '#FDFAF2',
      padding: '8px 10px 14px',
      borderTop: '1px solid #E0D8CC',
    }}>
      <div style={{
        display: 'flex',
        background: '#E8F0EC',
        borderRadius: 14,
        padding: 4,
        gap: 2,
        maxWidth: 680,
        margin: '0 auto',
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <div
              key={id}
              onClick={() => setView(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 0 6px',
                borderRadius: 10,
                gap: 5,
                cursor: 'pointer',
                background: active ? '#1A5C3A' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <Icon />
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                fontFamily: 'DM Sans, sans-serif',
                color: active ? '#E8F5EE' : '#4A6256',
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
