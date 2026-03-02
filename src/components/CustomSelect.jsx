import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import './CustomSelect.css';

const CustomSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Select an option",
    className = "",
    searchable = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleSelect = (option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`custom-select-container ${className}`} ref={dropdownRef}>
            <div
                className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={handleToggle}
            >
                <span className={`selected-value ${!selectedOption ? 'placeholder' : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={18} className={`chevron-icon ${isOpen ? 'rotated' : ''}`} />
            </div>

            {isOpen && (
                <div className="custom-select-dropdown">
                    {searchable && (
                        <div className="select-search-box">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                            {searchTerm && (
                                <X
                                    size={14}
                                    className="clear-icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchTerm('');
                                    }}
                                />
                            )}
                        </div>
                    )}
                    <div className="options-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`select-option ${option.value === value ? 'selected' : ''}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option.label}
                                </div>
                            ))
                        ) : (
                            <div className="no-options">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
