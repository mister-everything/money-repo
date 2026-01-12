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

type MenuOptionInput = string | MenuOption;

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
   * Accent color used for toggles and effects
   */
  accentColor?: string;
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
  menuOptions?: MenuOptionInput[];
  /**
   * Emits whenever selected menu options change
   */
  onOptionsChange?: (options: string[]) => void;
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

const BRAND_COLORS = {
  primary: "var(--color-orange-500)",
  accent: "var(--color-accent)",
  ring: "var(--color-ring)",
  card: "var(--color-card)",
  foreground: "var(--color-foreground)",
  border: "var(--color-border)",
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

const mixWithTransparent = (color: string, ratio: number) => {
  const safeRatio = clamp(ratio);
  return `color-mix(in oklch, ${color} ${safeRatio * 100}%, transparent)`;
};

interface SendButtonProps {
  isDisabled: boolean;
}

interface MenuOption {
  label: string;
  value: string;
}

interface OptionToggleProps {
  selectedOptions: string[];
  menuOptions: MenuOption[];
  onToggle: (optionValue: string) => void;
  accentColor: string;
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
const SendButton = memo(({ isDisabled }: SendButtonProps) => {
  return (
    <button
      type="submit"
      aria-label="Send message"
      disabled={isDisabled}
      className={`ml-auto self-center h-9 w-9 flex items-center justify-center rounded-full border transition-all z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
        isDisabled
          ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-transparent"
          : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg border-transparent"
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
    accentColor,
  }: OptionToggleProps) => {
    if (menuOptions.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 mt-2 px-3 z-20 relative">
        {menuOptions.map(({ label, value }) => {
          const isSelected = selectedOptions.includes(value);
          const selectedStyles = isSelected
            ? {
                backgroundColor: mixWithTransparent(accentColor, 0.15),
                color: accentColor,
                borderColor: mixWithTransparent(accentColor, 0.4),
                boxShadow: `0 6px 18px ${mixWithTransparent(accentColor, 0.22)}`,
              }
            : undefined;

          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                isSelected
                  ? "text-primary"
                  : "bg-muted/60 text-muted-foreground border-border/50 hover:bg-muted/80 hover:text-foreground"
              }`}
              style={{
                fontFamily: '"Inter", sans-serif',
                ...selectedStyles,
              }}
              aria-pressed={isSelected}
            >
              {label}
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

    const transitionStyle: React.CSSProperties = {
      transition: `opacity ${animationDuration}ms ease`,
    };

    const perimeterShadow = `
      0 0 0 1px ${mixWithTransparent(BRAND_COLORS.primary, 0.25 * glowIntensity)},
      0 0 16px ${mixWithTransparent(BRAND_COLORS.primary, 0.35 * glowIntensity)},
      0 0 28px ${mixWithTransparent(BRAND_COLORS.ring, 0.25 * glowIntensity)}
    `;

    const hoverShadow = `
      0 0 18px ${mixWithTransparent(BRAND_COLORS.primary, 0.4 * glowIntensity)},
      0 0 36px ${mixWithTransparent(BRAND_COLORS.ring, 0.32 * glowIntensity)}
    `;

    // const cursorGradient = `radial-gradient(circle 140px at ${mousePosition.x}% ${mousePosition.y}%, ${mixWithTransparent(BRAND_COLORS.primary, 0.3)}, ${mixWithTransparent(BRAND_COLORS.accent, 0.18)} 50%, transparent 75%)`;

    return (
      <>
        {/* Enhanced liquid glass background */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: `linear-gradient(120deg, ${mixWithTransparent(
              BRAND_COLORS.card,
              0.1,
            )}, ${mixWithTransparent(BRAND_COLORS.primary, 0.05)}, ${mixWithTransparent(
              BRAND_COLORS.card,
              0.12,
            )})`,
            backdropFilter: "blur(32px)",
          }}
        ></div>

        {/* Outside border glow effect */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none"
          style={{
            ...transitionStyle,
            boxShadow: perimeterShadow,
            filter: "blur(0.5px)",
          }}
        ></div>

        {/* Enhanced outside glow on hover */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 pointer-events-none"
          style={{
            ...transitionStyle,
            boxShadow: hoverShadow,
            filter: "blur(1px)",
          }}
        ></div>

        {/* Cursor following gradient */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-30 pointer-events-none blur-sm"
          style={{ ...transitionStyle }}
        ></div>

        {/* Subtle trail animation overlay */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-25 overflow-hidden blur-sm"
          style={transitionStyle}
        >
          <div
            className="absolute inset-0 transform -translate-x-full group-hover:translate-x-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${mixWithTransparent(
                BRAND_COLORS.primary,
                0.16,
              )}, transparent)`,
              transitionProperty: "transform",
              transitionDuration: `${animationDuration * 2}ms`,
              transitionTimingFunction: "ease-out",
            }}
          ></div>
        </div>

        {/* Subtle shimmer overlay */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-25 animate-pulse blur-sm"
          style={{
            ...transitionStyle,
            background: `linear-gradient(90deg, transparent, ${mixWithTransparent(
              BRAND_COLORS.accent,
              0.12,
            )}, transparent)`,
          }}
        ></div>

        {/* Minimal gradient background on hover */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 group-focus-within:opacity-15 blur-sm"
          style={{
            ...transitionStyle,
            background: `linear-gradient(120deg, ${mixWithTransparent(
              BRAND_COLORS.primary,
              0.12,
            )}, ${mixWithTransparent(BRAND_COLORS.accent, 0.08)}, ${mixWithTransparent(
              BRAND_COLORS.ring,
              0.12,
            )})`,
          }}
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
          <div
            className="w-full h-full rounded-full animate-ping"
            style={{
              background: `radial-gradient(circle, ${mixWithTransparent(
                BRAND_COLORS.primary,
                0.35,
              )} 0%, ${mixWithTransparent(BRAND_COLORS.accent, 0.25)} 60%, transparent 100%)`,
            }}
          ></div>
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
          className="w-full min-h-8 bg-transparent text-sm font-normal text-left self-center placeholder:text-muted-foreground/70 border-0 outline-none px-3 pr-10 py-1 z-20 relative resize-none overflow-y-auto text-foreground"
          style={{
            fontFamily: '"Inter", sans-serif',
            letterSpacing: "-0.14px",
            lineHeight: "22px",
            maxHeight: `${maxHeight}px`,
            color: textColor,
          }}
          disabled={disabled}
        />
        <SendButton isDisabled={isSubmitDisabled} />
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
  textColor = BRAND_COLORS.foreground,
  accentColor = BRAND_COLORS.primary,
  backgroundOpacity = 0.15,
  showEffects = true,
  menuOptions = ["문제", "보기", "해설"],
  onOptionsChange,
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
  const normalizedMenuOptions = useMemo<MenuOption[]>(
    () =>
      menuOptions.map((option) =>
        typeof option === "string" ? { label: option, value: option } : option,
      ),
    [menuOptions],
  );

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

  const backgroundStrength = clamp(backgroundOpacity, 0.05, 1);
  const surfaceColor = mixWithTransparent(
    BRAND_COLORS.card,
    backgroundStrength,
  );
  const surfaceHoverColor = mixWithTransparent(
    BRAND_COLORS.card,
    clamp(backgroundStrength + 0.08, 0, 1),
  );

  const containerStyles = useMemo<React.CSSProperties>(
    () => ({
      "--prompt-surface": surfaceColor,
      "--prompt-surface-hover": surfaceHoverColor,
      boxShadow:
        "0 12px 40px rgba(15, 23, 42, 0.12), 0 6px 20px rgba(15, 23, 42, 0.08)",
      transition: `all ${animationDuration}ms ease, box-shadow ${animationDuration}ms ease`,
    }),
    [animationDuration, surfaceColor, surfaceHoverColor],
  );

  useEffect(() => {
    onOptionsChange?.(selectedOptions);
  }, [onOptionsChange, selectedOptions]);

  return (
    <ChatInputContext.Provider value={contextValue}>
      <form
        onSubmit={handleSubmit}
        className={`mx-auto min-h-12 ${baseWidthClass} transition-all ease-out ${focusWidthClass} translate-y-0 opacity-100 ${className}`}
        style={{
          transition: `transform ${animationDuration}ms, opacity 200ms, width ${animationDuration}ms`,
        }}
      >
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          className="relative flex flex-col w-full min-h-full backdrop-blur-2xl shadow-lg rounded-3xl p-3 overflow-visible group border border-border/60 transition-all [background:var(--prompt-surface)] hover:[background:var(--prompt-surface-hover)] focus-within:[background:var(--prompt-surface-hover)]"
          style={containerStyles}
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
              menuOptions={normalizedMenuOptions}
              onToggle={toggleOption}
              accentColor={accentColor}
            />
          )}
        </div>
      </form>
    </ChatInputContext.Provider>
  );
}
