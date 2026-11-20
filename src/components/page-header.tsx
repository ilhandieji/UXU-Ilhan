import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export function PageHeader({ trail }: { trail: string[] }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {trail.map((item, i) => (
          <span key={item} className={i === trail.length - 1 ? 'text-foreground' : undefined}>
            {i > 0 && <span className="mr-1.5">/</span>}
            {item}
          </span>
        ))}
      </nav>
    </header>
  );
}
