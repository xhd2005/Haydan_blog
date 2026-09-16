'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Code2 } from 'lucide-react';
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

// 递归格式化 ReactNode 中的纯文本中英文间距
function applyPanguToChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    return formatPangu(children);
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
          blockquote: ({ node, children, ...props }) => (
            <blockquote
              className="border-l-4 border-emerald-500 bg-secondary/40 pl-4 py-3 my-5 rounded-r-xl text-muted-foreground italic leading-relaxed"
              {...props}
            >
              {applyPanguToChildren(children)}
            </blockquote>
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
          img: ({ node, src, alt, ...props }: any) => (
            <span className="block my-8">
              <SafeImage
                src={src || ''}
                alt={alt || ''}
                aspectRatio="16/9"
                containerClassName="rounded-2xl border border-border shadow-md max-h-[500px] w-full"
                className="max-h-[500px] w-full object-cover"
              />
              {alt && (
                <span className="block text-center text-xs text-muted-foreground mt-2.5 font-mono">
                  {alt}
                </span>
              )}
            </span>
          ),
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
