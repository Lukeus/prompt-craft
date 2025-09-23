import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CommandLineIcon } from '@heroicons/react/24/outline';

export interface CommandPaletteItem {
  id: string;
  title: string;
  description?: string;
  shortcut?: string;
  group?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandPaletteItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(focusTimer);
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredCommands = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      return commands;
    }

    return commands.filter((command) => {
      const haystack = `${command.title} ${command.description ?? ''} ${command.group ?? ''}`.toLowerCase();
      return haystack.includes(trimmedQuery);
    });
  }, [commands, query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="command-palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="command-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
          >
            <div className="command-palette__header">
              <CommandLineIcon className="w-4 h-4 text-primary-300" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search commands..."
                aria-label="Command search"
              />
              <kbd className="command-palette__shortcut">Esc</kbd>
            </div>

            <div className="command-palette__body">
              {filteredCommands.length === 0 ? (
                <div className="command-palette__empty">
                  <p>No commands match "{query}".</p>
                </div>
              ) : (
                <ul>
                  {filteredCommands.map((command) => (
                    <li key={command.id}>
                      <button
                        type="button"
                        className="command-palette__item"
                        onClick={() => {
                          command.action();
                          onClose();
                        }}
                      >
                        <div>
                          <p className="title">{command.title}</p>
                          {command.description && (
                            <p className="description">{command.description}</p>
                          )}
                        </div>
                        <div className="meta">
                          {command.group && <span className="group">{command.group}</span>}
                          {command.shortcut && <kbd>{command.shortcut}</kbd>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
