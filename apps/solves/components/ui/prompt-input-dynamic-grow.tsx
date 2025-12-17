"use client";
import React, {
  createContext,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ===== TYPES =====

interface RippleEffect {
  x: number;
  y: number;
  id: number;
}

interface Position {
  x: number;
  y: number;
}

interface ChatInputProps {
  /**
   * Placeholder text for the input field
   */
  placeholder?: string;
  /**
   * Function called when the form is submitted
   */
  onSubmit?: (value: string) => void;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  /**
   * Intensity of the glow effect (0.1 to 1.0)
   */
  glowIntensity?: number;
  /**
   * Whether the input expands on focus
   */
  expandOnFocus?: boolean;
  /**
   * Duration of animations in ms
   */
  animationDuration?: number;
  /**
   * Text color
   */
  textColor?: string;
  /**
   * Background opacity (0.1 to 1.0)
   */
  backgroundOpacity?: number;
  /**
   * Whether to show visual effects
   */
  showEffects?: boolean;
  /**
   * Available menu options
   */
  menuOptions?: string[];
  /**
   * Minimum height of the input container (in pixels or Tailwind class)
   */
  minHeight?: string | number;
  /**
   * Maximum height of the textarea (in pixels)
   */
  maxHeight?: number;
  /**
   * Custom className for the form element
   */
  className?: string;
}

interface InputAreaProps {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  placeholder: string;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  isSubmitDisabled: boolean;
  textColor: string;
  maxHeight?: number;
}

interface GlowEffectsProps {
  glowIntensity: number;
  mousePosition: Position;
  animationDuration: number;
  enabled: boolean;
}

interface RippleEffectsProps {
  ripples: RippleEffect[];
  enabled: boolean;
}

interface SendButtonProps {
  isDisabled: boolean;
  textColor: string;
}

interface OptionToggleProps {
  selectedOptions: string[];
  menuOptions: string[];
  onToggle: (option: string) => void;
  textColor: string;
}

// ===== CONTEXT =====

interface ChatInputContextProps {
  mousePosition: Position;
  ripples: RippleEffect[];
  addRipple: (x: number, y: number) => void;
  animationDuration: number;
  glowIntensity: number;
  textColor: string;
  showEffects: boolean;
}

const ChatInputContext = createContext<ChatInputContextProps | undefined>(
  undefined,
);

// ===== COMPONENTS =====

// Send button component
const SendButton = memo(({ isDisabled, textColor }: SendButtonProps) => {
  return (
    <button
      type="submit"
      aria-label="Send message"
      disabled={isDisabled}
      className={`ml-auto self-center h-8 w-8 flex items-center justify-center rounded-full border-0 p-0 transition-all z-20 ${
        isDisabled
          ? "opacity-40 cursor-not-allowed bg-gray-400 text-white/60"
          : "opacity-90 bg-[#0A1217] text-white hover:opacity-100 cursor-pointer hover:shadow-lg"
      }`}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`block ${isDisabled ? "opacity-50" : "opacity-100"}`}
      >
        <path
          d="M16 22L16 10M16 10L11 15M16 10L21 15"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
});

SendButton.displayName = "SendButton";

// Option toggle buttons
const OptionToggles = memo(
  ({
    selectedOptions,
    menuOptions,
    onToggle,
    textColor,
  }: OptionToggleProps) => {
    if (menuOptions.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 mt-2 px-3 z-20 relative">
        {menuOptions.map((option) => {
          const isSelected = selectedOptions.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                isSelected
                  ? `bg-[${textColor}]/15 text-[${textColor}] border-[${textColor}]/40 shadow-sm`
                  : "bg-white/50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-white/70"
              }`}
              style={{ fontFamily: '"Inter", sans-serif' }}
              aria-pressed={isSelected}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  },
);

OptionToggles.displayName = "OptionToggles";

// Visual effects component
const GlowEffects = memo(
  ({
    glowIntensity,
    mousePosition,
    animationDuration,
    enabled,
  }: GlowEffectsProps) => {
    if (!enabled) return null;

    const transitionStyle = `transition-opacity duration-${animationDuration}`;

    return (
      <>
        {/* Enhanced liquid glass background */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/8 via-white/12 to-white/8 backdrop-blur-2xl rounded-3xl"></div>

        {/* Outside border glow effect */}
        <div
          className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 ${transitionStyle} pointer-events-none`}
          style={{
            boxShadow: `
            0 0 0 1px rgba(147, 51, 234, ${0.2 * glowIntensity}),
            0 0 8px rgba(147, 51, 234, ${0.3 * glowIntensity}),
            0 0 16px rgba(236, 72, 153, ${0.2 * glowIntensity}),
            0 0 24px rgba(59, 130, 246, ${0.15 * glowIntensity})
          `,
            filter: "blur(0.5px)",
          }}
        ></div>

        {/* Enhanced outside glow on hover */}
        <div
          className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 ${transitionStyle} pointer-events-none`}
          style={{
            boxShadow: `
            0 0 12px rgba(147, 51, 234, ${0.4 * glowIntensity}),
            0 0 20px rgba(236, 72, 153, ${0.25 * glowIntensity}),
            0 0 32px rgba(59, 130, 246, ${0.2 * glowIntensity})
          `,
            filter: "blur(1px)",
          }}
        ></div>

        {/* Cursor following gradient */}
        <div
          className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none blur-sm`}
          style={{
            background: `radial-gradient(circle 120px at ${mousePosition.x}% ${mousePosition.y}%, rgba(147,51,234,0.08) 0%, rgba(236,72,153,0.05) 30%, rgba(59,130,246,0.04) 60%, transparent 100%)`,
          }}
        ></div>

        {/* Subtle trail animation overlay */}
        <div
          className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 overflow-hidden blur-sm`}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/8 to-transparent transform -translate-x-full group-hover:translate-x-full"
            style={{
              transitionProperty: "transform",
              transitionDuration: `${animationDuration * 2}ms`,
              transitionTimingFunction: "ease-out",
            }}
          ></div>
        </div>

        {/* Subtle shimmer overlay */}
        <div
          className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-25 ${transitionStyle} bg-gradient-to-r from-transparent via-white/4 to-transparent animate-pulse blur-sm`}
        ></div>

        {/* Minimal gradient background on hover */}
        <div
          className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-15 group-focus-within:opacity-10 transition-opacity duration-300 bg-gradient-to-r from-purple-400/5 via-pink-400/5 to-blue-400/5 blur-sm`}
        ></div>
      </>
    );
  },
);

GlowEffects.displayName = "GlowEffects";

// Ripple effects component
const RippleEffects = memo(({ ripples, enabled }: RippleEffectsProps) => {
  if (!enabled || ripples.length === 0) return null;

  return (
    <>
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none blur-sm"
          style={{
            left: ripple.x - 25,
            top: ripple.y - 25,
            width: 50,
            height: 50,
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400/15 via-pink-400/10 to-blue-400/15 animate-ping"></div>
        </div>
      ))}
    </>
  );
});

RippleEffects.displayName = "RippleEffects";

// Input area component
const InputArea = memo(
  ({
    value,
    setValue,
    placeholder,
    handleKeyDown,
    disabled,
    isSubmitDisabled,
    textColor,
    maxHeight = 96, // 기본값: 24 * 4px = 96px
  }: InputAreaProps) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height =
          Math.min(scrollHeight, maxHeight) + "px";
      }
    }, [value, maxHeight]);

    return (
      <div className="flex-1 relative h-full flex items-center">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Message Input"
          rows={1}
          className={`w-full min-h-8 bg-transparent text-sm font-normal text-left self-center text-[${textColor}] placeholder-[#6B7280] border-0 outline-none px-3 pr-10 py-1 z-20 relative resize-none overflow-y-auto`}
          style={{
            fontFamily: '"Inter", sans-serif',
            letterSpacing: "-0.14px",
            lineHeight: "22px",
            maxHeight: `${maxHeight}px`,
          }}
          disabled={disabled}
        />
        <SendButton isDisabled={isSubmitDisabled} textColor={textColor} />
      </div>
    );
  },
);

InputArea.displayName = "InputArea";

export default function PromptInputDynamicGrow({
  placeholder = "Ask Qlaus",
  onSubmit = (value: string) => console.log("Submitted:", value),
  disabled = false,
  glowIntensity = 0.4,
  expandOnFocus = true,
  animationDuration = 500,
  textColor = "#0A1217",
  backgroundOpacity = 0.15,
  showEffects = true,
  menuOptions = ["문제", "보기", "해설"],
  maxHeight = 96,
  className = "",
}: ChatInputProps) {
  // State
  const [value, setValue] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const [mousePosition, setMousePosition] = useState<Position>({
    x: 50,
    y: 50,
  });

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const throttleRef = useRef<number | null>(null);

  // Handle submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim() && onSubmit && !disabled) {
        onSubmit(value.trim());
        setValue("");
      }
    },
    [value, onSubmit, disabled],
  );

  // Handle key down
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    },
    [handleSubmit],
  );

  // Throttled mouse move handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!showEffects) return;

      if (containerRef.current && !throttleRef.current) {
        throttleRef.current = window.setTimeout(() => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setMousePosition({ x, y });
          }
          throttleRef.current = null;
        }, 50); // throttle to 50ms
      }
    },
    [showEffects],
  );

  // Add ripple effect
  const addRipple = useCallback(
    (x: number, y: number) => {
      if (!showEffects) return;

      // Limit number of ripples for performance
      if (ripples.length < 5) {
        const newRipple: RippleEffect = {
          x,
          y,
          id: Date.now(),
        };

        setRipples((prev) => [...prev, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
          setRipples((prev) =>
            prev.filter((ripple) => ripple.id !== newRipple.id),
          );
        }, 600);
      }
    },
    [ripples, showEffects],
  );

  // Handle click for ripple effect
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        addRipple(x, y);
      }
    },
    [addRipple],
  );

  // Toggle option selection
  const toggleOption = useCallback((option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((opt) => opt !== option)
        : [...prev, option],
    );
  }, []);

  // Create context value
  const contextValue = useMemo(
    () => ({
      mousePosition,
      ripples,
      addRipple,
      animationDuration,
      glowIntensity,
      textColor,
      showEffects,
    }),
    [
      mousePosition,
      ripples,
      addRipple,
      animationDuration,
      glowIntensity,
      textColor,
      showEffects,
    ],
  );

  // Check if submit is disabled
  const isSubmitDisabled = disabled || !value.trim();

  // Calculate width classes
  const baseWidthClass = "w-70";
  const focusWidthClass = expandOnFocus ? "focus-within:w-100" : "";

  // Background opacity class
  const bgOpacityValue = Math.floor(backgroundOpacity * 100);
  const backgroundClass = `bg-white/${bgOpacityValue}`;

  return (
    <ChatInputContext.Provider value={contextValue}>
      <form
        onSubmit={handleSubmit}
        className={`relative z-50 mx-auto min-h-12 ${baseWidthClass} transition-all duration-${animationDuration} ease-out ${focusWidthClass} translate-y-0 opacity-100 ${className}`}
        style={{
          transition: `transform ${animationDuration}ms, opacity 200ms, width ${animationDuration}ms`,
        }}
      >
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          className={`relative flex flex-col w-full min-h-full ${backgroundClass} backdrop-blur-xl shadow-lg rounded-3xl p-2 overflow-visible group transition-all duration-${animationDuration} hover:${backgroundClass.replace(/\/\d+$/, `/${bgOpacityValue + 5}`)}`}
          style={{
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            transition: `all ${animationDuration}ms ease, box-shadow ${animationDuration}ms ease`,
          }}
        >
          {/* Visual effects */}
          <GlowEffects
            glowIntensity={glowIntensity}
            mousePosition={mousePosition}
            animationDuration={animationDuration}
            enabled={showEffects}
          />

          {/* Ripple effects */}
          <RippleEffects ripples={ripples} enabled={showEffects} />

          {/* Input row */}
          <div className="flex items-center relative z-20">
            <InputArea
              value={value}
              setValue={setValue}
              placeholder={placeholder}
              handleKeyDown={handleKeyDown}
              disabled={disabled}
              isSubmitDisabled={isSubmitDisabled}
              textColor={textColor}
              maxHeight={maxHeight}
            />
          </div>

          {/* Toggle options row */}
          {expandOnFocus && (
            <OptionToggles
              selectedOptions={selectedOptions}
              menuOptions={menuOptions}
              onToggle={toggleOption}
              textColor={textColor}
            />
          )}
        </div>
      </form>
    </ChatInputContext.Provider>
  );
}
