// Top navigation + wallet pill.
//
// Self-contained mock so the page renders standalone. When integrating, replace
// this with the app's real nav/wallet components — the page below doesn't depend
// on anything here.

const NAV_ITEMS = [
  "Dashboard",
  "Trade",
  "Markets",
  "Portfolio",
  "Swap",
  "Leaderboard",
] as const;

const ACTIVE = "Leaderboard";

export function LeaderboardHeader({ walletAddress = "0x3f…a91c", network = "EVM · ARBITRUM" }) {
  return (
    <header className="lb-header lb-shell">
      <div className="lb-logo">azabu</div>

      <nav className="lb-nav">
        {NAV_ITEMS.map((item) => (
          <button key={item} type="button" className="lb-nav-item" data-active={item === ACTIVE}>
            {item}
          </button>
        ))}
      </nav>

      <button type="button" className="lb-wallet">
        <span className="lb-wallet-dot" />
        <span className="lb-wallet-text">
          <b>{walletAddress}</b>
          <small>{network}</small>
        </span>
      </button>
    </header>
  );
}
