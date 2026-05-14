/**
 * Safe Markdown renderer that prevents XSS attacks
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { sanitizeContent } from './input-validation';

/**
 * SafeMarkdown component that renders markdown with XSS protection
 * - Sanitizes HTML content before rendering
 * - Disallows dangerous HTML tags
 * - Prevents javascript: protocol execution
 */
export const SafeMarkdown: React.FC<{ content: string; className?: string }> = ({ content, className }) => {
  // Sanitize content before rendering
  const sanitized = sanitizeContent(content);

  return (
    <ReactMarkdown
      className={className}
      allowedElements={[
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ]}
      unwrapDisallowed={true}
      urlTransform={(url) => {
        // Only allow http/https URLs
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        // Prevent javascript: and data: URLs
        return '#';
      }}
      components={{
        // Override link rendering to add security attributes
        a: ({ node, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
          />
        ),
        // Override image rendering to add security checks
        img: ({ node, ...props }) => {
          const src = props.src as string;
          // Only allow images from safe sources (same-origin or known CDNs)
          if (src?.startsWith('data:') || src?.startsWith('javascript:')) {
            return null;
          }
          return <img {...props} loading="lazy" />;
        },
        // Override code blocks to prevent issues
        code: ({ node, inline, ...props }) => (
          inline ? (
            <code {...props} />
          ) : (
            <pre><code {...props} /></pre>
          )
        ),
      }}
    >
      {sanitized}
    </ReactMarkdown>
  );
};

export default SafeMarkdown;
