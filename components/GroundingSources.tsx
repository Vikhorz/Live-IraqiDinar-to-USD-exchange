import React from 'react';
import type { GroundingChunk, Translation } from '../types';

interface GroundingSourcesProps {
  sources: GroundingChunk[];
  t: Translation;
}

const LinkIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1 rtl:mr-1 rtl:ml-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

export const GroundingSources: React.FC<GroundingSourcesProps> = ({ sources, t }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  const validSources = sources.filter(source => source.web && source.web.uri && source.web.title);

  if (validSources.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-2 text-center">
      {validSources.map((source, index) => (
        <li key={index}>
          <a
            href={source.web!.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center transition-colors duration-300"
            aria-label={`Source: ${source.web!.title}`}
          >
            <span>{source.web!.title}</span>
            <LinkIcon />
          </a>
        </li>
      ))}
    </ul>
  );
};