/* ── PING APP — app.js ────────────────────────────────────────────────────
   Single-file React app (no build tool needed).
   Run by opening index.html in a browser, or deploy to any static host.
   
   STRUCTURE:
   1. Constants & helpers
   2. Reusable components (Badge, Avatar, Toast, ChatScreen)
   3. Tab components (FriendsTab, GroupsTab, ProfileTab)
   4. AuthScreen
   5. Main App (root)
──────────────────────────────────────────────────────────────────────────── */

const { useState, useEffect, useRef } = React;

// ── 1. CONSTANTS ───────────────────────────────────────────────────────────

// Pre-existing valid codes — login with any of these
const VALID_CODES = ['D@rsh', 'darsh1', 'darsh2', 'darsh3', 'vishit', 'Avishi.j'];

// The creator's secret code (gets 👑 tag + rank management)
const CREATOR_CODE = 'D@rsh';

// All available ranks with their emoji label and CSS class
const RANKS = {
  creator: { label: '👑 Creator', cls: 'creator' },
  elite:   { label: '✨ Elite',   cls: 'elite'   },
  admin:   { label: '🛡 Admin',   cls: 'admin'   },
  vip:     { label: '⭐ VIP',     cls: 'vip'     },
};

// Fake auto-reply messages for DM simulation
const AUTO_REPLIES = [
  'Cool! 🔥', 'Nice one 👍', 'Haha yeah', 'Sure thing!',
  'Tell me more ✨', 'I agree!', 'LOL', 'Ping! 💬',
  'That\'s wild 😂', 'Yep yep', 'Let\'s gooo 🚀', 'Facts 💯'
];

// ── 2. STORAGE HELPERS ─────────────────────────────────────────────────────

// Read from localStorage with a default fallback
function ls(key, defaultVal) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : defaultVal; }
  catch { return defaultVal; }
}

// Write to localStorage
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── 3. ACCOUNT INITIALISATION ──────────────────────────────────────────────

// Sets up default accounts for the 6 pre-defined codes on first load
function initAccounts() {
  let accounts = ls('ping_accounts', {});
  VALID_CODES.forEach(code => {
    if (!accounts[code]) {
      const name = code.replace('@', '').replace('.', '');
      accounts[code] = {
        code,
        username: name,
        displayName: name,
        bio: '',
        avatar: '',
        bannerColor: '#7c6df0',
        rank: code === CREATOR_CODE ? 'creator' : null,
        friends: [],
        createdAt: Date.now(),
      };
    }
  });
  lsSet('ping_accounts', accounts);
  return accounts;
}

// ── 4. REUSABLE COMPONENTS ─────────────────────────────────────────────────

// Generates a consistent hue from a string (for default avatar colors)
function hashColor(str) {
  let h = 0;
  for (let c of (str || '')) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

// Rank badge shown next to usernames
function Badge({ rank }) {
  if (!rank || !RANKS[rank]) return null;
  const r = RANKS[rank];
  return React.createElement('span', { className: `badge ${r.cls}` }, r.label);
}

// Avatar circle — shows image if set, otherwise first letter of name
function Av({ src, name, size = '', online = null }) {
  const letter = (name || '?')[0].toUpperCase();
  const hue = hashColor(name || '');
  return React.createElement('div', { className: 'avatar' },
    React.createElement('div', {
      className: `av-circle ${size}`,
      style: src ? {} : { background: `hsl(${hue}, 55%, 28%)` }
    },
      src
        ? React.createElement('img', { src, alt: name, onError: e => { e.target.style.display = 'none'; } })
        : letter
    ),
    // Show online dot if online prop is provided
    online !== null && React.createElement('div', { className: `status-dot ${online ? 'online' : 'offline'}` })
  );
}

// Toast notification that fades in/out
function Toast({ msg }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (msg) {
      setVis(true);
      const t = setTimeout(() => setVis(false), 2200);
      return () => clearTimeout(t);
    }
  }, [msg]);
  return React.createElement('div', { className: `toast ${vis ? 'show' : ''}` }, msg);
}

// ── CHAT SCREEN ────────────────────────────────────────────────────────────

function ChatScreen({ chatId, title, subtitle, avatar, currentUser, onBack }) {
  const [msgs, setMsgs] = useState([]);
  const [inp, setInp] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const storKey = `ping_chat_${chatId}`;
  const isDM = !chatId.startsWith('grp_');

  // Load saved messages for this chat
  useEffect(() => {
    setMsgs(ls(storKey, []));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 60);
  }, [chatId]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (msgs.length) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // Send a message
  function send() {
    const text = inp.trim();
    if (!text) return;
    const m = {
      id: Date.now(),
      sender: currentUser.displayName,
      senderCode: currentUser.code,
      text,
      time: Date.now(),
    };
    const updated = [...msgs, m];
    setMsgs(updated);
    lsSet(storKey, updated);
    setInp('');

    // Simulate a reply in DM chats (50% chance)
    if (isDM && Math.random() < 0.5) {
      setTyping(true);
      const delay = 1000 + Math.random() * 1200;
      setTimeout(() => {
        const reply = {
          id: Date.now() + 1,
          sender: title,
          senderCode: 'bot',
          text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
          time: Date.now(),
        };
        const u2 = [...updated, reply];
        setMsgs(u2);
        lsSet(storKey, u2);
        setTyping(false);
      }, delay);
    }
  }

  function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return React.createElement('div', { className: 'chat-screen' },
    // Header
    React.createElement('div', { className: 'chat-header' },
      React.createElement('span', { className: 'chat-back', onClick: onBack }, '←'),
      React.createElement(Av, { src: avatar, name: title, online: true }),
      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
        React.createElement('div', { style: { fontFamily: 'var(--head)', fontWeight: 700, fontSize: 16 } }, title),
        React.createElement('div', { style: { fontSize: 12, color: 'var(--muted)' } }, subtitle || 'Active now')
      )
    ),
    // Messages area
    React.createElement('div', { className: 'chat-msgs' },
      msgs.length === 0 && React.createElement('div', { className: 'empty' },
        React.createElement('div', { className: 'ei' }, '💬'),
        React.createElement('p', null, 'No messages yet.\nSay hello!')
      ),
      msgs.map(m => {
        const me = m.senderCode === currentUser.code;
        return React.createElement('div', { key: m.id, className: `msg-wrap ${me ? 'me' : ''}` },
          !me && React.createElement(Av, { name: m.sender, size: 'sm' }),
          React.createElement('div', null,
            !me && React.createElement('div', { className: 'msg-sender' }, m.sender),
            React.createElement('div', { className: 'msg-bubble' }, m.text)
          ),
          React.createElement('div', { className: 'msg-time' }, fmtTime(m.time))
        );
      }),
      // Typing indicator
      typing && React.createElement('div', { className: 'typing-ind' },
        React.createElement('div', { className: 'typing-dots' },
          React.createElement('span'), React.createElement('span'), React.createElement('span')
        ),
        `${title} is typing...`
      ),
      React.createElement('div', { ref: bottomRef })
    ),
    // Input bar
    React.createElement('div', { className: 'chat-input-bar' },
      React.createElement('input', {
        className: 'chat-inp',
        placeholder: 'Message...',
        value: inp,
        onChange: e => setInp(e.target.value),
        onKeyDown: e => e.key === 'Enter' && send()
      }),
      React.createElement('button', { className: 'send-btn', onClick: send }, '➤')
    )
  );
}

// ── 5. TAB: FRIENDS ────────────────────────────────────────────────────────

function FriendsTab({ currentUser, accounts, onUpdateAccounts, onChat, showToast }) {
  const [addOpen, setAddOpen] = useState(false);
  const [addCode, setAddCode] = useState('');
  const [search, setSearch]   = useState('');
  const me = accounts[currentUser.code];
  const friendCodes = me?.friends || [];
  const friends = friendCodes.map(c => accounts[c]).filter(Boolean);
  const filtered = friends.filter(f =>
    f.displayName.toLowerCase().includes(search.toLowerCase())
  );

  function addFriend() {
    const code = addCode.trim();
    if (!code) { showToast('Enter a code'); return; }
    if (code === currentUser.code) { showToast("That's you! 😄"); return; }
    if (friendCodes.includes(code)) { showToast('Already friends ✓'); return; }

    let accs = { ...accounts };
    // Auto-create account if code is new
    if (!accs[code]) {
      const name = code.replace('@', '').replace('.', '');
      accs[code] = {
        code, username: name, displayName: name,
        bio: '', avatar: '', bannerColor: '#7c6df0',
        rank: null, friends: [], createdAt: Date.now(),
      };
    }
    accs[currentUser.code] = { ...accs[currentUser.code], friends: [...friendCodes, code] };
    lsSet('ping_accounts', accs);
    onUpdateAccounts(accs);
    setAddCode('');
    setAddOpen(false);
    showToast(`Added ${accs[code].displayName}! 🎉`);
  }

  return React.createElement('div', { style: { flex: 1, overflow: 'auto', paddingBottom: 8 } },
    // Top bar
    React.createElement('div', { className: 'topbar' },
      window.PING_LOGO
        ? React.createElement('div', { className: 'logo-sm' }, React.createElement('img', { src: window.PING_LOGO, alt: 'Ping' }))
        : React.createElement('div', { className: 'logo-sm-fallback' }, 'P'),
      React.createElement('h2', null, 'Friends'),
      React.createElement('button', { className: 'btn sm', onClick: () => setAddOpen(true) }, '+ Add')
    ),
    // Search bar
    React.createElement('div', { className: 'search-bar' },
      React.createElement('span', { style: { color: 'var(--muted)', fontSize: 16 } }, '🔍'),
      React.createElement('input', {
        placeholder: 'Search friends...',
        value: search,
        onChange: e => setSearch(e.target.value)
      })
    ),
    // Friend list
    friends.length === 0
      ? React.createElement('div', { className: 'empty' },
          React.createElement('div', { className: 'ei' }, '👥'),
          React.createElement('p', null, 'No friends yet.\nTap + Add to connect with someone!')
        )
      : filtered.map(f => {
          const isOnline = Math.random() > 0.4; // randomised for demo
          return React.createElement('div', {
            key: f.code,
            className: 'user-row',
            onClick: () => onChat(`dm_${[currentUser.code, f.code].sort().join('_')}`, f.displayName, f.avatar)
          },
            React.createElement(Av, { src: f.avatar, name: f.displayName, online: isOnline }),
            React.createElement('div', { className: 'user-info' },
              React.createElement('div', { className: 'name' },
                f.displayName,
                f.rank && React.createElement(Badge, { rank: f.rank })
              ),
              React.createElement('div', { className: 'sub' }, `@${f.code}`)
            ),
            React.createElement('span', { style: { color: 'var(--muted)', fontSize: 20 } }, '›')
          );
        }),
    // Add friend modal
    addOpen && React.createElement('div', {
      className: 'modal-overlay',
      onClick: e => e.target === e.currentTarget && setAddOpen(false)
    },
      React.createElement('div', { className: 'modal-sheet' },
        React.createElement('div', { className: 'modal-handle' }),
        React.createElement('div', { className: 'modal-title' }, 'Add Friend'),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Their Secret Code'),
          React.createElement('input', {
            className: 'inp',
            placeholder: 'e.g. darsh1',
            value: addCode,
            onChange: e => setAddCode(e.target.value),
            onKeyDown: e => e.key === 'Enter' && addFriend(),
            autoCapitalize: 'none'
          })
        ),
        React.createElement('button', { className: 'btn', onClick: addFriend }, 'Add Friend'),
        React.createElement('div', { style: { height: 10 } })
      )
    )
  );
}

// ── 6. TAB: GROUPS ─────────────────────────────────────────────────────────

function GroupsTab({ currentUser, onChat, showToast }) {
  const [groups, setGroups] = useState(() => ls('ping_groups', []));
  const [createOpen, setCreateOpen] = useState(false);
  const [gName, setGName] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gEmoji, setGEmoji] = useState('🌐');

  const GROUP_EMOJIS = ['🌐','🎮','🎵','🏀','🔥','💡','✨','🚀','🎉','🐉','🎨','⚡'];

  function saveGroups(g) { setGroups(g); lsSet('ping_groups', g); }

  function createGroup() {
    if (!gName.trim()) { showToast('Group name required'); return; }
    const g = {
      id: `grp_${Date.now()}`,
      name: gName.trim(),
      desc: gDesc.trim(),
      emoji: gEmoji,
      members: [currentUser.code],
      createdBy: currentUser.code,
      createdAt: Date.now(),
    };
    saveGroups([...groups, g]);
    setGName(''); setGDesc(''); setGEmoji('🌐');
    setCreateOpen(false);
    showToast('Group created! 🎉');
  }

  const myGroups = groups.filter(g => g.members.includes(currentUser.code));

  return React.createElement('div', { style: { flex: 1, overflow: 'auto', paddingBottom: 8 } },
    React.createElement('div', { className: 'topbar' },
      window.PING_LOGO
        ? React.createElement('div', { className: 'logo-sm' }, React.createElement('img', { src: window.PING_LOGO, alt: 'Ping' }))
        : React.createElement('div', { className: 'logo-sm-fallback' }, 'P'),
      React.createElement('h2', null, 'Groups'),
      React.createElement('button', { className: 'btn sm', onClick: () => setCreateOpen(true) }, '+ New')
    ),
    myGroups.length === 0
      ? React.createElement('div', { className: 'empty' },
          React.createElement('div', { className: 'ei' }, '🫂'),
          React.createElement('p', null, 'No groups yet.\nCreate one to start chatting!')
        )
      : myGroups.map(g =>
          React.createElement('div', {
            key: g.id,
            className: 'group-row',
            onClick: () => onChat(g.id, g.name, '', `${g.members.length} members`)
          },
            React.createElement('div', { className: 'group-av' }, g.emoji),
            React.createElement('div', { className: 'user-info' },
              React.createElement('div', { className: 'name' }, g.name),
              React.createElement('div', { className: 'sub' },
                `${g.members.length} member${g.members.length !== 1 ? 's' : ''} • ${g.desc || 'No description'}`
              )
            ),
            React.createElement('span', { style: { color: 'var(--muted)', fontSize: 20 } }, '›')
          )
        ),
    // Create group modal
    createOpen && React.createElement('div', {
      className: 'modal-overlay',
      onClick: e => e.target === e.currentTarget && setCreateOpen(false)
    },
      React.createElement('div', { className: 'modal-sheet' },
        React.createElement('div', { className: 'modal-handle' }),
        React.createElement('div', { className: 'modal-title' }, 'Create Group'),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Pick an Emoji'),
          React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 } },
            GROUP_EMOJIS.map(em =>
              React.createElement('span', {
                key: em,
                onClick: () => setGEmoji(em),
                style: { fontSize: 26, cursor: 'pointer', opacity: gEmoji === em ? 1 : 0.35, transition: 'opacity .15s' }
              }, em)
            )
          )
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Group Name'),
          React.createElement('input', {
            className: 'inp',
            placeholder: 'My awesome group',
            value: gName,
            onChange: e => setGName(e.target.value)
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Description (optional)'),
          React.createElement('input', {
            className: 'inp',
            placeholder: "What's this group about?",
            value: gDesc,
            onChange: e => setGDesc(e.target.value)
          })
        ),
        React.createElement('button', { className: 'btn', onClick: createGroup }, 'Create Group'),
        React.createElement('div', { style: { height: 10 } })
      )
    )
  );
}

// ── 7. TAB: PROFILE ────────────────────────────────────────────────────────

function ProfileTab({ currentUser, accounts, onUpdateAccounts, onLogout, showToast }) {
  const me = accounts[currentUser.code];
  const [editOpen, setEditOpen] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const [dName, setDName] = useState(me?.displayName || '');
  const [bio, setBio] = useState(me?.bio || '');
  const [bannerColor, setBannerColor] = useState(me?.bannerColor || '#7c6df0');
  const [targetCode, setTargetCode] = useState('');
  const [targetRank, setTargetRank] = useState('');
  const isCreator = me?.rank === 'creator';
  const friendCount = (me?.friends || []).length;

  const BANNER_COLORS = ['#7c6df0','#f06d8e','#3ecf8e','#f5c842','#5b8ef0','#f06d6d','#a78bfa','#fb923c'];

  // Save edited profile
  function saveProfile() {
    const accs = {
      ...accounts,
      [currentUser.code]: { ...me, displayName: dName.trim() || me.displayName, bio, bannerColor }
    };
    lsSet('ping_accounts', accs);
    onUpdateAccounts(accs);
    setEditOpen(false);
    showToast('Profile saved! ✓');
  }

  // Handle profile photo upload
  function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const accs = { ...accounts, [currentUser.code]: { ...me, avatar: ev.target.result } };
      lsSet('ping_accounts', accs);
      onUpdateAccounts(accs);
      showToast('Photo updated! 📸');
    };
    reader.readAsDataURL(file);
  }

  // Creator: assign a rank to any user
  function assignRank() {
    if (!targetCode.trim() || !accounts[targetCode]) { showToast('User not found'); return; }
    if (targetCode === CREATOR_CODE) { showToast('Cannot change Creator rank'); return; }
    const accs = { ...accounts, [targetCode]: { ...accounts[targetCode], rank: targetRank || null } };
    lsSet('ping_accounts', accs);
    onUpdateAccounts(accs);
    setRankOpen(false);
    showToast(targetRank ? `Rank assigned! ✓` : 'Rank removed');
  }

  return React.createElement('div', { style: { flex: 1, overflow: 'auto', paddingBottom: 8 } },
    // Top bar
    React.createElement('div', { className: 'topbar' },
      window.PING_LOGO
        ? React.createElement('div', { className: 'logo-sm' }, React.createElement('img', { src: window.PING_LOGO, alt: 'Ping' }))
        : React.createElement('div', { className: 'logo-sm-fallback' }, 'P'),
      React.createElement('h2', null, 'Profile'),
      React.createElement('button', { className: 'btn sm', onClick: () => { setDName(me?.displayName||''); setBio(me?.bio||''); setBannerColor(me?.bannerColor||'#7c6df0'); setEditOpen(true); } }, 'Edit')
    ),
    // Banner
    React.createElement('div', {
      className: 'profile-banner',
      style: { background: `linear-gradient(135deg, ${me?.bannerColor || '#7c6df0'}, #5b8ef0)` }
    }),
    // Avatar (tap to change photo)
    React.createElement('div', { className: 'profile-av-wrap' },
      React.createElement('label', { style: { cursor: 'pointer' }, title: 'Tap to change photo' },
        React.createElement(Av, { src: me?.avatar, name: me?.displayName, size: 'lg' }),
        React.createElement('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onChange: uploadAvatar })
      )
    ),
    // Profile info
    React.createElement('div', { className: 'profile-info-pad' },
      React.createElement('div', { className: 'profile-name' },
        me?.displayName,
        me?.rank && React.createElement(Badge, { rank: me.rank })
      ),
      React.createElement('code', {
        style: { fontSize: 12, color: 'var(--neon)', background: 'rgba(124,109,240,.1)', padding: '3px 8px', borderRadius: 50, marginTop: 6, display: 'inline-block' }
      }, `@${currentUser.code}`),
      me?.bio && React.createElement('div', { className: 'profile-bio' }, me.bio),
      React.createElement('div', { className: 'profile-stat' },
        React.createElement('div', { className: 'stat-item' },
          React.createElement('div', { className: 'sv' }, friendCount),
          React.createElement('div', { className: 'sk' }, 'Friends')
        )
      ),
      // Creator-only rank management tool
      isCreator && React.createElement('div', { style: { marginTop: 24 } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 } },
          'Creator Tools'
        ),
        React.createElement('button', { className: 'btn ghost', onClick: () => setRankOpen(true), style: { marginBottom: 10 } },
          '⚡ Manage Member Ranks'
        )
      ),
      React.createElement('div', { style: { marginTop: 16 } }),
      React.createElement('button', { className: 'btn danger', onClick: onLogout }, 'Sign Out')
    ),

    // ── Edit Profile Modal ──
    editOpen && React.createElement('div', {
      className: 'modal-overlay',
      onClick: e => e.target === e.currentTarget && setEditOpen(false)
    },
      React.createElement('div', { className: 'modal-sheet' },
        React.createElement('div', { className: 'modal-handle' }),
        React.createElement('div', { className: 'modal-title' }, 'Edit Profile'),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Display Name'),
          React.createElement('input', { className: 'inp', value: dName, onChange: e => setDName(e.target.value) })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Bio'),
          React.createElement('textarea', {
            className: 'inp', rows: 3,
            style: { resize: 'none', borderRadius: 'var(--r)' },
            value: bio,
            onChange: e => setBio(e.target.value),
            placeholder: 'Tell people about yourself...'
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Banner Color'),
          React.createElement('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap' } },
            BANNER_COLORS.map(c =>
              React.createElement('div', {
                key: c,
                className: 'color-swatch',
                onClick: () => setBannerColor(c),
                style: {
                  background: c,
                  border: bannerColor === c ? '3px solid white' : '3px solid transparent',
                }
              })
            )
          )
        ),
        React.createElement('button', { className: 'btn', onClick: saveProfile }, 'Save Changes'),
        React.createElement('div', { style: { height: 10 } })
      )
    ),

    // ── Rank Management Modal (Creator only) ──
    rankOpen && React.createElement('div', {
      className: 'modal-overlay',
      onClick: e => e.target === e.currentTarget && setRankOpen(false)
    },
      React.createElement('div', { className: 'modal-sheet' },
        React.createElement('div', { className: 'modal-handle' }),
        React.createElement('div', { className: 'modal-title' }, '⚡ Manage Ranks'),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'User Code'),
          React.createElement('input', {
            className: 'inp',
            placeholder: 'Enter their secret code...',
            value: targetCode,
            onChange: e => setTargetCode(e.target.value),
            autoCapitalize: 'none'
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Select Rank'),
          // Rank options (exclude creator)
          Object.entries(RANKS).filter(([k]) => k !== 'creator').map(([k, v]) =>
            React.createElement('div', {
              key: k,
              className: `rank-opt ${targetRank === k ? 'selected' : ''}`,
              onClick: () => setTargetRank(k)
            },
              React.createElement('div', { className: 'rk-em' }, v.label.split(' ')[0]),
              React.createElement('div', { className: 'rk-info' },
                React.createElement('div', { className: 'rk-name' }, v.label),
                React.createElement('div', { className: 'rk-desc' },
                  k === 'elite' ? 'Top community member'
                  : k === 'admin' ? 'Helps moderate the server'
                  : 'Special VIP member'
                )
              ),
              targetRank === k && React.createElement('span', { style: { color: 'var(--neon)' } }, '✓')
            )
          ),
          // Remove rank option
          React.createElement('div', {
            className: `rank-opt ${targetRank === '' ? 'selected' : ''}`,
            onClick: () => setTargetRank('')
          },
            React.createElement('div', { className: 'rk-em' }, '🔘'),
            React.createElement('div', { className: 'rk-info' },
              React.createElement('div', { className: 'rk-name' }, 'Remove Rank')
            ),
            targetRank === '' && React.createElement('span', { style: { color: 'var(--neon)' } }, '✓')
          )
        ),
        React.createElement('button', { className: 'btn', onClick: assignRank }, 'Apply Rank'),
        React.createElement('div', { style: { height: 10 } })
      )
    )
  );
}

// ── 8. AUTH SCREEN ─────────────────────────────────────────────────────────

function AuthScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  function login() {
    if (!username.trim() || !code.trim()) { setErr('Please fill in both fields'); return; }
    let accounts = initAccounts();
    // Auto-create account for new codes
    if (!accounts[code]) {
      const name = username.trim();
      accounts[code] = {
        code, username: name, displayName: name,
        bio: '', avatar: '', bannerColor: '#7c6df0',
        rank: null, friends: [], createdAt: Date.now(),
      };
      lsSet('ping_accounts', accounts);
    }
    onLogin(accounts[code], accounts);
  }

  return React.createElement('div', { className: 'screen' },
    React.createElement('div', { className: 'auth-wrap' },
      // Logo section
      React.createElement('div', { className: 'auth-logo' },
        window.PING_LOGO
          ? React.createElement('div', { className: 'logo-mark' },
              React.createElement('img', { src: window.PING_LOGO, alt: 'Ping logo' })
            )
          : React.createElement('div', { className: 'logo-mark-text' }, 'P'),
        React.createElement('h1', null, 'Ping'),
        React.createElement('p', null, 'Connect. Chat. Vibe.')
      ),
      // Login form
      React.createElement('div', { className: 'auth-form' },
        err && React.createElement('div', { className: 'err-box' }, err),
        React.createElement('div', null,
          React.createElement('label', null, 'Username'),
          React.createElement('input', {
            className: 'inp',
            placeholder: 'Choose a display name',
            value: username,
            onChange: e => { setUsername(e.target.value); setErr(''); }
          })
        ),
        React.createElement('div', null,
          React.createElement('label', null, 'Secret Code'),
          React.createElement('input', {
            className: 'inp',
            placeholder: 'Enter your secret code',
            value: code,
            onChange: e => { setCode(e.target.value); setErr(''); },
            onKeyDown: e => e.key === 'Enter' && login(),
            type: 'text',
            autoCapitalize: 'none',
            autoComplete: 'off'
          })
        ),
        React.createElement('button', { className: 'btn', onClick: login }, 'Enter Ping'),
        React.createElement('p', { className: 'auth-note' },
          'Use your secret code to log in.\nNew code? A fresh account is created automatically.'
        )
      )
    )
  );
}

// ── 9. MAIN APP (root component) ───────────────────────────────────────────

function App() {
  const [accounts, setAccounts] = useState(() => initAccounts());
  const [currentUser, setCurrentUser] = useState(() => ls('ping_session', null));
  const [tab, setTab] = useState('friends');
  const [chat, setChat] = useState(null); // { id, title, avatar, subtitle }
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }

  function login(user, accs) {
    setCurrentUser(user);
    setAccounts(accs);
    lsSet('ping_session', user); // persist session
  }

  function logout() {
    setCurrentUser(null);
    lsSet('ping_session', null);
  }

  function updateAccounts(accs) {
    setAccounts(accs);
    // Keep currentUser in sync
    if (currentUser && accs[currentUser.code]) setCurrentUser(accs[currentUser.code]);
  }

  function openChat(id, title, avatar, subtitle) {
    setChat({ id, title, avatar, subtitle });
  }

  // Show auth screen if not logged in
  if (!currentUser) return React.createElement(AuthScreen, { onLogin: login });

  // Bottom nav tabs
  const TABS = [
    { id: 'friends', icon: '👥', label: 'Friends' },
    { id: 'groups',  icon: '🫂', label: 'Groups'  },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ];

  return React.createElement('div', { className: 'screen', style: { opacity: 1, transform: 'none' } },
    React.createElement('div', { className: 'main-wrap' },
      React.createElement('div', { className: 'tab-content' },
        tab === 'friends' && React.createElement(FriendsTab, { currentUser, accounts, onUpdateAccounts: updateAccounts, onChat: openChat, showToast }),
        tab === 'groups'  && React.createElement(GroupsTab,  { currentUser, accounts, onUpdateAccounts: updateAccounts, onChat: openChat, showToast }),
        tab === 'profile' && React.createElement(ProfileTab, { currentUser, accounts, onUpdateAccounts: updateAccounts, onLogout: logout, showToast })
      ),
      // Bottom navigation bar
      React.createElement('nav', { className: 'bottom-nav' },
        TABS.map(t =>
          React.createElement('div', {
            key: t.id,
            className: `nav-tab ${tab === t.id ? 'active' : ''}`,
            onClick: () => setTab(t.id)
          },
            React.createElement('span', { className: 'nav-icon' }, t.icon),
            React.createElement('span', { className: 'nav-label' }, t.label)
          )
        )
      )
    ),
    // Chat screen (slides over main content)
    chat && React.createElement(ChatScreen, {
      chatId: chat.id,
      title: chat.title,
      subtitle: chat.subtitle,
      avatar: chat.avatar,
      currentUser,
      onBack: () => setChat(null)
    }),
    // Toast notification
    React.createElement(Toast, { msg: toast })
  );
}

// Mount the app
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
