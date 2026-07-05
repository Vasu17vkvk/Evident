import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, Calendar, Clock, User, ArrowRight } from "lucide-react";
import { Container } from "../layout/Container";
import { Section } from "../layout/Section";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";
import { BLOG_POSTS, type BlogPost } from "../../data/content";

export function Blog() {
  const { postId } = useParams<{ postId?: string }>();
  const navigate = useNavigate();

  // Selected post if routing into detail view
  const activePost = useMemo(() => {
    if (!postId) return null;
    return BLOG_POSTS.find((p) => p.id === postId) || null;
  }, [postId]);

  // If a post is active, show the details view
  if (activePost) {
    return (
      <Section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/5 blur-[120px]" />
        
        <Container className="relative max-w-4xl">
          <FadeIn>
            {/* Back Button */}
            <button
              onClick={() => navigate("/blog")}
              className="group mb-8 inline-flex items-center gap-2 text-xs font-mono-label uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
              Back to blog
            </button>

            {/* Category Tag */}
            <span className="font-mono-label mb-4 inline-block text-[9px] uppercase tracking-widest text-accent border border-accent/30 bg-accent/5 px-2 py-0.5">
              {activePost.category}
            </span>

            {/* Title */}
            <h1 className="mb-6 text-3xl font-semibold leading-tight tracking-tighter text-foreground sm:text-4xl md:text-5xl">
              {activePost.title}
            </h1>

            {/* Metadata (Author, Date, Read Time) */}
            <div className="flex flex-wrap items-center gap-6 border-b border-border pb-8 mb-10 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="size-4 text-accent" strokeWidth={1.5} />
                <span>By {activePost.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-accent" strokeWidth={1.5} />
                <span>{activePost.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-accent" strokeWidth={1.5} />
                <span>{activePost.readTime}</span>
              </div>
            </div>

            {/* Blog Post Content Body */}
            <article className="prose prose-invert max-w-none mb-16">
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg mb-6 font-medium text-foreground/90">
                {activePost.excerpt}
              </p>
              
              {/* Parse paragraph blocks simply */}
              {activePost.content.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground md:text-base mb-6">
                  {para}
                </p>
              ))}
            </article>

            {/* Support section / Newsletter */}
            <div className="border border-border p-6 md:p-8 bg-input/20">
              <h3 className="text-lg font-semibold tracking-tight text-foreground mb-2">
                Subscribe to our newsletter
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                Get the latest news regarding semantic search, vector engineering, and generative QA direct to your inbox.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="flex-1 bg-input/40 border border-border text-xs rounded-none px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent"
                />
                <button className="font-mono-label text-[10px] uppercase tracking-widest text-accent-foreground bg-accent hover:bg-accent/80 transition-colors px-6 py-3">
                  Subscribe
                </button>
              </form>
            </div>
          </FadeIn>
        </Container>
      </Section>
    );
  }

  // Filter lists: Featured and standard posts
  const featuredPost = BLOG_POSTS.find((p) => p.featured);
  const standardPosts = BLOG_POSTS.filter((p) => !p.featured);

  return (
    <Section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/5 blur-[120px]" />

      <Container>
        {/* Header */}
        <FadeIn className="mx-auto mb-16 max-w-3xl text-center md:mb-24">
          <p className="font-mono-label mb-5 text-[10px] uppercase tracking-widest text-accent">
            Resource Blog
          </p>
          <h1 className="mb-6 text-4xl font-semibold leading-none tracking-tighter text-foreground sm:text-5xl md:text-6xl">
            Insights on AI & Search
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Stay updated with vector embedding breakthroughs, document ingestion standards, and generative search engineering guides.
          </p>
        </FadeIn>

        {/* Featured Post Card */}
        {featuredPost && (
          <FadeIn className="mb-16">
            <div className="group border border-border bg-input/20 hover:border-accent transition-all duration-300">
              <div className="grid grid-cols-1 items-stretch md:grid-cols-12">
                <div className="md:col-span-7 p-6 md:p-10 flex flex-col justify-between">
                  <div>
                    <span className="font-mono-label mb-4 inline-block text-[9px] uppercase tracking-widest text-accent">
                      Featured · {featuredPost.category}
                    </span>
                    <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-3xl mb-4 group-hover:text-accent transition-colors duration-200">
                      {featuredPost.title}
                    </h2>
                    <p className="text-xs leading-relaxed text-muted-foreground md:text-sm mb-6">
                      {featuredPost.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/80 pt-4 mt-4">
                    <div className="flex gap-4 text-[10px] font-mono-label text-muted-foreground">
                      <span>{featuredPost.date}</span>
                      <span>·</span>
                      <span>{featuredPost.readTime}</span>
                    </div>
                    <Link
                      to={`/blog/${featuredPost.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-mono-label uppercase tracking-widest text-foreground hover:text-accent transition-colors"
                    >
                      Read Post
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
                <div className="hidden md:block md:col-span-5 bg-border/40 relative min-h-[300px] overflow-hidden">
                  {/* Decorative digital lines */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[6rem] font-bold text-border/30 select-none">
                    RAG
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Regular Posts Grid */}
        <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {standardPosts.map((post) => (
            <StaggerItem key={post.id} className="h-full">
              <div className="group flex h-full flex-col justify-between border border-border bg-input/10 p-6 hover:border-accent hover:bg-input/20 transition-all duration-300">
                <div>
                  <span className="font-mono-label mb-3 inline-block text-[9px] uppercase tracking-widest text-accent">
                    {post.category}
                  </span>
                  <h3 className="text-base font-semibold tracking-tight text-foreground md:text-lg mb-3 group-hover:text-accent transition-colors duration-200">
                    {post.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground mb-6">
                    {post.excerpt}
                  </p>
                </div>
                
                <div className="flex items-center justify-between border-t border-border/80 pt-4">
                  <div className="flex gap-3 text-[9px] font-mono-label text-muted-foreground">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <Link
                    to={`/blog/${post.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono-label uppercase tracking-widest text-foreground hover:text-accent transition-colors"
                  >
                    Read
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
