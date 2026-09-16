'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Code2, Info, Lightbulb, AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react';
import { SafeImage } from './SafeImage';
import { useI18n } from '@/lib/i18n';
import { useAiCodeLens, AiCodeLensButton, AiCodeLensPanel } from './blog/AiCodeLensDrawer';

// 中英文混排微空格规范化（Pangu Spacing）
export function formatPangu(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/([\u4e00-\u9fa5])([A-Za-z0-9_`~+=\-/*#])/g, '$1 $2')
    .replace(/([A-Za-z0-9_`~+=\-/*#])([\u4e00-\u9fa5])/g, '$1 $2');
}

// 递归格式化 ReactNode 中的纯文本中英文间距与 ==高亮标注==
function applyPanguToChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    const pangu = formatPangu(children);
    if (pangu.includes('==')) {
      const parts = pangu.split(/(==[^=]+==)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
          const inner = part.slice(2, -2);
          return (
            <mark
              key={idx}
              className="px-1.5 py-0.5 mx-0.5 rounded-md bg-amber-400/25 dark:bg-amber-500/25 text-amber-900 dark:text-amber-200 font-medium border-b-2 border-amber-500/60"
            >
              {inner}
            </mark>
          );
        }
        return part;
      });
    }
    return pangu;
  }
  if (Array.isArray(children)) {
    return React.Children.map(children, (child) => applyPanguToChildren(child));
  }
  return children;
}

// 高对比度多语言代码语法高亮分词器（亮色/暗色 WCAG AAA 级专业对比度）
function highlightSyntax(code: string, lang: string = ''): React.ReactNode[] {
  const lines = code.split('\n');
  const normalizedLang = lang.toLowerCase();

  return lines.map((line, lineIdx) => {
    // 处理整行或行尾注释
    const commentMatch = line.match(/^(\s*)((\/\/|#|\/\*|\*).*)$/);
    if (commentMatch) {
      return (
        <div key={lineIdx} className="table-row">
          <span className="table-cell select-none pr-4 text-right text-[11px] font-mono text-zinc-400/60 dark:text-zinc-600/70">
            {lineIdx + 1}
          </span>
          <span className="table-cell italic text-zinc-500 dark:text-zinc-400">
            {commentMatch[1]}{commentMatch[2]}
          </span>
        </div>
      );
    }

    // 针对单行的基础 Token 正则分词（支持关键字、字符串、数字、函数等）
    // 词法正则：字符串 | 注释 | 关键字 | 函数名 | 数字 | 标点与标识符
    const tokenRegex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\/\/[^\n]*)|(\b(?:const|let|var|function|return|if|else|for|while|import|from|export|default|class|interface|type|public|private|protected|async|await|try|catch|finally|new|throw|typeof|void|boolean|number|string|null|undefined|true|false|def|self|lambda|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|package|final|extends|implements|static)\b)|(\b[A-Za-z_$][A-Za-z0-9_$]*(?=\s*\())|(\b\d+(?:\.\d+)?\b)|([{}()[\];,.:<>+\-*\/%=!&|^~?]+)|([A-Za-z_$][A-Za-z0-9_$]*)|(\s+)|(.)/g;

    const tokens: React.ReactNode[] = [];
    let match: RegExpExecArray | null;
    let keyIdx = 0;

    while ((match = tokenRegex.exec(line)) !== null) {
      const [full, str, comment, keyword, func, num, punct, ident, space, other] = match;

      if (space) {
        tokens.push(<span key={keyIdx++}>{space}</span>);
      } else if (str) {
        // 字符串：亮色深绿、暗色高亮荧光绿
        tokens.push(
          <span key={keyIdx++} className="text-emerald-700 dark:text-emerald-300 font-medium">
            {str}
          </span>
        );
      } else if (comment) {
        // 行内注释：斜体暗灰
        tokens.push(
          <span key={keyIdx++} className="text-zinc-500 dark:text-zinc-400 italic">
            {comment}
          </span>
        );
      } else if (keyword) {
        // 关键字：亮色深紫、暗色鲜亮紫粉
        tokens.push(
          <span key={keyIdx++} className="text-purple-700 dark:text-purple-400 font-semibold">
            {keyword}
          </span>
        );
      } else if (func) {
        // 函数/方法调用：亮色深蓝、暗色鲜亮天蓝
        tokens.push(
          <span key={keyIdx++} className="text-sky-700 dark:text-sky-300 font-medium">
            {func}
          </span>
        );
      } else if (num) {
        // 数值：亮色暖琥珀褐、暗色亮黄橙
        tokens.push(
          <span key={keyIdx++} className="text-amber-700 dark:text-amber-300">
            {num}
          </span>
        );
      } else if (punct) {
        // 符号/标点：高对比度中性色
        tokens.push(
          <span key={keyIdx++} className="text-zinc-600 dark:text-zinc-400 font-normal">
            {punct}
          </span>
        );
      } else if (ident) {
        // 普通标识符
        tokens.push(
          <span key={keyIdx++} className="text-foreground">
            {ident}
          </span>
        );
      } else if (other) {
        tokens.push(<span key={keyIdx++}>{other}</span>);
      }
    }

    return (
      <div key={lineIdx} className="table-row">
        <span className="table-cell select-none pr-4 text-right text-[11px] font-mono text-zinc-400/60 dark:text-zinc-600/70">
          {lineIdx + 1}
        </span>
        <span className="table-cell whitespace-pre">
          {tokens.length > 0 ? tokens : ' '}
        </span>
      </div>
    );
  });
}

function CodeBlock({ codeString, lang }: { codeString: string; lang?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const { isOpen, loading, lensData, activeTab, setActiveTab, toggle } = useAiCodeLens(codeString, lang);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-8 rounded-2xl overflow-hidden border border-zinc-200/90 dark:border-white/[0.1] bg-zinc-50/90 dark:bg-[#0f1015] shadow-md dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6)]">
      {/* 顶部工具栏：macOS 经典红黄绿三色圆点 + 语言徽标 + AI 透视 + 复制按钮 */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-100/90 dark:bg-[#161820] border-b border-zinc-200/70 dark:border-white/[0.08] text-[11px] font-mono text-muted-foreground select-none">
        <div className="flex items-center gap-3">
          {/* macOS 经典窗口三色圆点 */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] opacity-90 shadow-sm" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] opacity-90 shadow-sm" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] opacity-90 shadow-sm" />
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/80 border border-border/50 text-[10px] font-semibold tracking-wider uppercase text-foreground">
            <Code2 className="w-3 h-3 text-emerald-500" />
            <span>{lang || 'code'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI 架构透视微光按钮 */}
          <AiCodeLensButton isOpen={isOpen} loading={loading} onToggle={toggle} />

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border/60 transition-all cursor-pointer"
            aria-label={t('detail.copy_code', '复制代码')}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">{t('detail.copied', '已复制')}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t('detail.copy_code', '复制代码')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 代码正文高对比度高亮展示 */}
      <div className="p-4 sm:p-5 overflow-x-auto text-xs font-mono leading-relaxed">
        <div className="table w-full">
          {highlightSyntax(codeString, lang)}
        </div>
      </div>

      {/* 内嵌折叠架构透视面板 */}
      <AiCodeLensPanel
        isOpen={isOpen}
        loading={loading}
        lensData={lensData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}

interface MarkdownViewerProps {
  content?: string;
  className?: string;
}

export function MarkdownViewer({ content = '', className = '' }: MarkdownViewerProps) {
  return (
    <article
      className={`prose prose-zinc dark:prose-invert max-w-none w-full space-y-5 leading-[1.8] tracking-[0.01em] text-foreground ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, children, ...props }) => (
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight mt-10 mb-4 border-b border-border pb-3 text-foreground"
              {...props}
            >
              {applyPanguToChildren(children)}
            </h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2
              className="text-xl sm:text-2xl font-semibold tracking-tight mt-8 mb-3.5 text-foreground"
              {...props}
            >
              {applyPanguToChildren(children)}
            </h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3
              className="text-lg sm:text-xl font-medium tracking-tight mt-6 mb-2.5 text-foreground"
              {...props}
            >
              {applyPanguToChildren(children)}
            </h3>
          ),
          p: ({ node, children, ...props }) => (
            <p className="text-muted-foreground leading-8 text-[15px] sm:text-base mb-5" {...props}>
              {applyPanguToChildren(children)}
            </p>
          ),
          ul: ({ node, children, ...props }) => (
            <ul className="list-disc list-inside space-y-2 my-4 text-muted-foreground" {...props}>
              {children}
            </ul>
          ),
          ol: ({ node, children, ...props }) => (
            <ol className="list-decimal list-inside space-y-2 my-4 text-muted-foreground" {...props}>
              {children}
            </ol>
          ),
          li: ({ node, children, ...props }) => (
            <li className="text-[15px] sm:text-base text-muted-foreground leading-7" {...props}>
              {applyPanguToChildren(children)}
            </li>
          ),
          blockquote: ({ node, children, ...props }: any) => {
            const childArray = React.Children.toArray(children);
            let calloutType: 'note' | 'tip' | 'warning' | 'important' | 'caution' | null = null;
            let cleanedChildren = children;

            const firstChild = childArray[0];
            if (firstChild && React.isValidElement(firstChild) && (firstChild.props as any)?.children) {
              const innerChildren = React.Children.toArray((firstChild.props as any).children);
              const firstText = typeof innerChildren[0] === 'string' ? innerChildren[0] : '';
              const match = firstText.match(/^\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);
              if (match) {
                calloutType = match[1].toLowerCase() as any;
                const remainingText = match[2];
                const newInnerChildren = [...innerChildren];
                if (remainingText) {
                  newInnerChildren[0] = remainingText;
                } else {
                  newInnerChildren.shift();
                }
                const newFirstChild = React.cloneElement(firstChild, {}, ...newInnerChildren);
                cleanedChildren = [newFirstChild, ...childArray.slice(1)];
              }
            }

            if (calloutType) {
              const configs = {
                note: {
                  border: 'border-blue-500/80',
                  bg: 'bg-blue-500/[0.08] dark:bg-blue-500/[0.12]',
                  icon: <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
                  title: '提示 (NOTE)',
                  text: 'text-blue-900 dark:text-blue-200',
                },
                tip: {
                  border: 'border-emerald-500/80',
                  bg: 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12]',
                  icon: <Lightbulb className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
                  title: '技巧 (TIP)',
                  text: 'text-emerald-900 dark:text-emerald-200',
                },
                warning: {
                  border: 'border-amber-500/80',
                  bg: 'bg-amber-500/[0.08] dark:bg-amber-500/[0.12]',
                  icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
                  title: '注意 (WARNING)',
                  text: 'text-amber-900 dark:text-amber-200',
                },
                important: {
                  border: 'border-purple-500/80',
                  bg: 'bg-purple-500/[0.08] dark:bg-purple-500/[0.12]',
                  icon: <AlertCircle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />,
                  title: '重要 (IMPORTANT)',
                  text: 'text-purple-900 dark:text-purple-200',
                },
                caution: {
                  border: 'border-rose-500/80',
                  bg: 'bg-rose-500/[0.08] dark:bg-rose-500/[0.12]',
                  icon: <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />,
                  title: '警告 (CAUTION)',
                  text: 'text-rose-900 dark:text-rose-200',
                },
              };
              const c = configs[calloutType];
              return (
                <div className={`my-5 rounded-2xl border-l-4 ${c.border} ${c.bg} p-4 text-sm shadow-xs backdrop-blur-xs`}>
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-2">
                    {c.icon}
                    <span>{c.title}</span>
                  </div>
                  <div className={`leading-relaxed ${c.text}`}>{applyPanguToChildren(cleanedChildren)}</div>
                </div>
              );
            }

            return (
              <blockquote
                className="border-l-4 border-emerald-500/80 bg-secondary/30 dark:bg-zinc-800/30 pl-4 py-3 my-5 rounded-r-2xl text-muted-foreground italic leading-relaxed"
                {...props}
              >
                {applyPanguToChildren(children)}
              </blockquote>
            );
          },
          details: ({ node, children, ...props }: any) => (
            <details className="my-4 rounded-2xl border border-border/80 bg-secondary/20 dark:bg-zinc-800/20 p-4 transition-all duration-200 group" {...props}>
              {children}
            </details>
          ),
          summary: ({ node, children, ...props }: any) => (
            <summary className="font-semibold text-foreground cursor-pointer select-none list-none flex items-center justify-between gap-2 text-sm" {...props}>
              <span>{applyPanguToChildren(children)}</span>
              <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform duration-200">▼</span>
            </summary>
          ),
          code: ({ node, inline, className: codeClassName, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-secondary font-mono text-xs text-emerald-600 dark:text-emerald-400 border border-border/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            const match = /language-(\w+)/.exec(codeClassName || '');
            const lang = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            return <CodeBlock codeString={codeString} lang={lang} />;
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 border border-border rounded-2xl shadow-sm">
              <table className="w-full text-left text-sm" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="p-3.5 bg-secondary/80 border-b border-border font-semibold text-foreground text-xs uppercase tracking-wider" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="p-3.5 border-b border-border/60 text-muted-foreground text-xs leading-relaxed" {...props} />
          ),
          a: ({ node, children, ...props }) => (
            <a
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-0.5"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {applyPanguToChildren(children)}
            </a>
          ),
          img: ({ node, src, alt, title, ...props }: any) => {
            const caption = title || alt;
            return (
              <figure className="my-8 flex flex-col items-center">
                <SafeImage
                  src={src || ''}
                  alt={alt || ''}
                  aspectRatio="auto"
                  containerClassName="rounded-2xl border border-border/80 shadow-md max-h-[650px] w-auto max-w-full overflow-hidden"
                  className="max-h-[650px] w-auto max-w-full object-contain mx-auto transition-transform duration-300 hover:scale-[1.01]"
                />
                {caption && (
                  <figcaption className="mt-2.5 px-3.5 py-1 rounded-full text-center text-xs text-muted-foreground/80 font-mono bg-secondary/50 dark:bg-zinc-800/50 border border-border/40 inline-flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse shrink-0" />
                    <span>{caption}</span>
                  </figcaption>
                )}
              </figure>
            );
          },
          hr: ({ node, ...props }) => (
            <hr className="my-10 border-border" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
