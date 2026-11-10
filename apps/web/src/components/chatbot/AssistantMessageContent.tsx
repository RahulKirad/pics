import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

function isInternalPath(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

type AssistantMessageContentProps = {
  text: string;
  onNavigate?: () => void;
};

function NavLinkButton({
  to,
  children,
  onNavigate,
}: {
  to: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link to={to} className="picshare-assistant-nav-btn" onClick={() => onNavigate?.()}>
      {children}
    </Link>
  );
}

function renderInline(text: string, keyPrefix: string, onNavigate?: () => void): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let part = 0;

  const pushPlain = (chunk: string) => {
    if (!chunk) return;
    const pathPattern = /(\/[a-z0-9][a-z0-9\-/_]*)/gi;
    let pathLast = 0;
    let pathMatch: RegExpExecArray | null;
    while ((pathMatch = pathPattern.exec(chunk)) !== null) {
      const before = chunk.slice(pathLast, pathMatch.index);
      if (before) nodes.push(<span key={`${keyPrefix}-t-${part++}`}>{before}</span>);
      const path = pathMatch[1]!;
      nodes.push(
        <NavLinkButton key={`${keyPrefix}-p-${part++}`} to={path} onNavigate={onNavigate}>
          {path}
        </NavLinkButton>,
      );
      pathLast = pathMatch.index + path.length;
    }
    if (pathLast < chunk.length) {
      nodes.push(<span key={`${keyPrefix}-t-${part++}`}>{chunk.slice(pathLast)}</span>);
    }
  };

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      pushPlain(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
    if (linkMatch) {
      const label = linkMatch[1]!;
      const href = linkMatch[2]!.trim();
      if (isInternalPath(href)) {
        nodes.push(
          <NavLinkButton key={`${keyPrefix}-l-${part++}`} to={href} onNavigate={onNavigate}>
            {label}
          </NavLinkButton>,
        );
      } else {
        nodes.push(
          <a
            key={`${keyPrefix}-e-${part++}`}
            href={href}
            className="picshare-assistant-text-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {label}
          </a>,
        );
      }
    } else if (/^\*\*[^*]+\*\*$/.test(token)) {
      const label = token.slice(2, -2);
      nodes.push(
        <strong key={`${keyPrefix}-b-${part++}`} className="font-semibold text-[#0f172a]">
          {label}
        </strong>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    pushPlain(text.slice(lastIndex));
  }

  return nodes.length ? nodes : [text];
}

function isOrderedListItem(line: string): boolean {
  return /^\d+\.\s+/.test(line.trim());
}

function isBulletListItem(line: string): boolean {
  return /^[-*•]\s+/.test(line.trim());
}

function isMarkdownLinkLine(line: string): boolean {
  return /^\[[^\]]+\]\([^)]+\)\s*$/.test(line.trim());
}

function parseLinkLine(line: string): { label: string; href: string } | null {
  const m = /^\[([^\]]+)\]\(([^)]+)\)\s*$/.exec(line.trim());
  if (!m) return null;
  return { label: m[1]!, href: m[2]!.trim() };
}

function stripListMarker(line: string): string {
  return line.trim().replace(/^(\d+\.|[-*•])\s+/, '');
}

export function AssistantMessageContent({ text, onNavigate }: AssistantMessageContentProps) {
  const blocks = text.split(/\n\n+/);

  return (
    <div className="picshare-assistant-markdown space-y-2">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').filter((line) => line.trim().length > 0);
        if (!lines.length) return null;

        if (lines.every(isMarkdownLinkLine)) {
          return (
            <div key={blockIndex} className="picshare-assistant-action-row">
              {lines.map((line, i) => {
                const parsed = parseLinkLine(line);
                if (!parsed || !isInternalPath(parsed.href)) return null;
                return (
                  <NavLinkButton key={i} to={parsed.href} onNavigate={onNavigate}>
                    {parsed.label}
                  </NavLinkButton>
                );
              })}
            </div>
          );
        }

        const allOrdered = lines.every(isOrderedListItem);
        const allBullets = lines.every(isBulletListItem);

        if (lines.length > 1 && allOrdered) {
          return (
            <ol key={blockIndex} className="list-decimal space-y-1 pl-5">
              {lines.map((line, i) => (
                <li key={i}>{renderInline(stripListMarker(line), `${blockIndex}-${i}`, onNavigate)}</li>
              ))}
            </ol>
          );
        }

        if (lines.length > 1 && allBullets) {
          return (
            <ul key={blockIndex} className="list-disc space-y-1 pl-5">
              {lines.map((line, i) => (
                <li key={i}>{renderInline(stripListMarker(line), `${blockIndex}-${i}`, onNavigate)}</li>
              ))}
            </ul>
          );
        }

        if (lines.length > 1) {
          return (
            <div key={blockIndex} className="space-y-1.5">
              {lines.map((line, i) => (
                <p key={i}>{renderInline(line, `${blockIndex}-${i}`, onNavigate)}</p>
              ))}
            </div>
          );
        }

        return <p key={blockIndex}>{renderInline(lines[0]!, `${blockIndex}`, onNavigate)}</p>;
      })}
    </div>
  );
}
