import React, { useState, useEffect, useRef } from 'react';
import { StockSearchResult } from '../types';
import { useTauri } from '../hooks/useTauri';

interface StockSearchProps {
  value: string;
  stockName: string;
  onSelect: (stock: StockSearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const StockSearch: React.FC<StockSearchProps> = ({
  value,
  stockName,
  onSelect,
  placeholder = "输入股票代码或名称搜索",
  disabled = false,
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const tauri = useTauri();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number>();

  // 同步外部 value 变化
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // 搜索防抖
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length >= 1) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const searchResults = await tauri.searchStocks(query.trim());
          setResults(searchResults);
          setShowResults(true);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('搜索股票失败:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, tauri]);

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const handleSelectStock = (stock: StockSearchResult) => {
    setQuery(stock.code);
    setShowResults(false);
    onSelect(stock);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectStock(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const displayValue = stockName && value ? `${value} - ${stockName}` : query;

  return (
    <div className="stock-search" ref={searchRef}>
      <div className="search-input-container">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="search-input"
          autoComplete="off"
        />
        {isLoading && (
          <div className="search-loading">
            <span className="loading-spinner">⟳</span>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((stock, index) => (
            <div
              key={stock.code}
              className={`search-result-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleSelectStock(stock)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="stock-code">{stock.code}</div>
              <div className="stock-name">{stock.name}</div>
              <div className="stock-market">{stock.market}</div>
            </div>
          ))}
        </div>
      )}

      {showResults && !isLoading && results.length === 0 && query.trim() && (
        <div className="search-results">
          <div className="search-no-results">
            未找到相关股票
          </div>
        </div>
      )}
    </div>
  );
};
