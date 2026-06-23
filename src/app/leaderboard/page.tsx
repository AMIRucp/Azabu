import { redirect } from "next/navigation";

// The leaderboard now lives inside the app shell (with the real header/nav).
// This standalone route just forwards into the app.
export default function LeaderboardRoute() {
  redirect("/");
}
