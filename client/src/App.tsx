import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthorDetail from "./pages/AuthorDetail";
import Authors from "./pages/Authors";
import Categories from "./pages/Categories";
import Home from "./pages/Home";
import Legal from "./pages/Legal";
import Library from "./pages/Library";
import NovelDetail from "./pages/NovelDetail";
import Novels from "./pages/Novels";
import Reader from "./pages/Reader";
import SearchPage from "./pages/SearchPage";
import Plans from "./pages/Plans";
import SubscriptionReturn from "./pages/SubscriptionReturn";
import AdminAuthors from "./pages/admin/AdminAuthors";
import AdminNovels from "./pages/admin/AdminNovels";
import AdminOperations from "./pages/admin/AdminOperations";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminAds from "./pages/admin/AdminAds";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminTaxonomy from "./pages/admin/AdminTaxonomy";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlansSettings from "./pages/admin/AdminPlansSettings";
import AdminAppearanceSettings from "./pages/admin/AdminAppearanceSettings";
import AdminSocialLinks from "./pages/admin/AdminSocialLinks";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/novels"} component={Novels} />
      <Route path={"/novels/:slug"}>{params => <NovelDetail slug={params.slug} />}</Route>
      <Route path={"/authors"} component={Authors} />
      <Route path={"/authors/:slug"}>{params => <AuthorDetail slug={params.slug} />}</Route>
      <Route path={"/categories"} component={Categories} />
      <Route path={"/categories/:slug"} component={Novels} />
      <Route path={"/read/:novelSlug/:chapterSlug"}>{params => <Reader novelSlug={params.novelSlug} chapterSlug={params.chapterSlug} />}</Route>
      <Route path={"/search"} component={SearchPage} />
      <Route path={"/plans"} component={Plans} />
      <Route path={"/subscription/return"} component={SubscriptionReturn} />
      <Route path={"/admin"} component={AdminOverview} />
      <Route path={"/admin/authors"} component={AdminAuthors} />
      <Route path={"/admin/novels"} component={AdminNovels} />
      <Route path={"/admin/taxonomy"} component={AdminTaxonomy} />
      <Route path={"/admin/system/users"} component={AdminUsers} />
      <Route path={"/admin/operations"} component={AdminOperations} />
      <Route path={"/admin/system/plans"} component={AdminPlansSettings} />
      <Route path={"/admin/system/appearance"} component={AdminAppearanceSettings} />
      <Route path={"/admin/system/social"} component={AdminSocialLinks} />
      <Route path={"/admin/media"} component={AdminMedia} />
      <Route path={"/admin/system/ads"} component={AdminAds} />
      <Route path={"/legal/:document"}>{params => <Legal document={params.document} />}</Route>
      <Route path={"/library"} component={Library} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
