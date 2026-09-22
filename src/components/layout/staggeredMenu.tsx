'use client'

import { gsap } from 'gsap'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'

export interface StaggeredMenuItem {
  label: string
  ariaLabel: string
  link: string
  icon?: React.ComponentType<{ className?: string }>
  dividerAfter?: boolean
}
export interface StaggeredMenuSocialItem {
  label: string
  link: string
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right'
  colors?: string[]
  items?: StaggeredMenuItem[]
  socialItems?: StaggeredMenuSocialItem[]
  displaySocials?: boolean
  displayItemNumbering?: boolean
  className?: string
  logoUrl?: string
  logoLightUrl?: string
  logoDarkUrl?: string
  menuButtonColor?: string
  openMenuButtonColor?: string
  accentColor?: string
  isFixed: boolean
  changeMenuColorOnOpen?: boolean
  closeOnClickAway?: boolean
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['#B19EEF', '#5227FF'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl = '/embedClubLogo-Light.svg',
  logoLightUrl = '/embedClubLogo-Light.svg',
  logoDarkUrl = '/embedClubLogo-Dark.svg',
  menuButtonColor = '#fff',
  openMenuButtonColor = '#000',
  changeMenuColorOnOpen = true,
  accentColor = '#5227FF',
  isFixed = false,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
}: StaggeredMenuProps) => {
  const { resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isDark = mounted && resolvedTheme === 'dark'
  const themeLogo = isDark ? logoDarkUrl || logoUrl : logoLightUrl || logoUrl
  const logoSrc = themeLogo
  const openRef = useRef(false)
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  const sectionGroups = React.useMemo(() => {
    const groups: StaggeredMenuItem[][] = []
    let currentGroup: StaggeredMenuItem[] = []

    for (const item of items) {
      currentGroup.push(item)
      if (item.dividerAfter) {
        groups.push(currentGroup)
        currentGroup = []
      }
    }
    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }
    return groups
  }, [items])

  const panelRef = useRef<HTMLDivElement | null>(null)
  const preLayersRef = useRef<HTMLDivElement | null>(null)
  const preLayerElsRef = useRef<HTMLElement[]>([])

  const plusHRef = useRef<HTMLSpanElement | null>(null)
  const plusVRef = useRef<HTMLSpanElement | null>(null)
  const iconRef = useRef<HTMLSpanElement | null>(null)

  const textInnerRef = useRef<HTMLSpanElement | null>(null)
  const textWrapRef = useRef<HTMLSpanElement | null>(null)
  const [textLines, setTextLines] = useState<string[]>(['Menu', 'Close'])

  const openTlRef = useRef<gsap.core.Timeline | null>(null)
  const closeTweenRef = useRef<gsap.core.Tween | null>(null)
  const spinTweenRef = useRef<gsap.core.Timeline | null>(null)
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null)
  const colorTweenRef = useRef<gsap.core.Tween | null>(null)

  const toggleBtnRef = useRef<HTMLButtonElement | null>(null)
  const busyRef = useRef(false)

  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current
      const preContainer = preLayersRef.current

      const plusH = plusHRef.current
      const plusV = plusVRef.current
      const icon = iconRef.current
      const textInner = textInnerRef.current

      if (!panel || !plusH || !plusV || !icon || !textInner) return

      let preLayers: HTMLElement[] = []
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[]
      }
      preLayerElsRef.current = preLayers

      const offscreen = position === 'left' ? -100 : 100
      gsap.set([panel, ...preLayers], { xPercent: offscreen })

      gsap.set(plusH, { transformOrigin: '50% 50%', rotation: 0, xPercent: -50, yPercent: -50 })
      gsap.set(plusV, { transformOrigin: '50% 50%', rotation: 90, xPercent: -50, yPercent: -50 })
      gsap.set(icon, { rotation: 0, transformOrigin: '50% 50%' })

      gsap.set(textInner, { yPercent: 0 })

      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor })
    })
    return () => ctx.revert()
  }, [menuButtonColor, position])

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current
    const layers = preLayerElsRef.current
    if (!panel) return null

    openTlRef.current?.kill()
    if (closeTweenRef.current) {
      closeTweenRef.current.kill()
      closeTweenRef.current = null
    }
    itemEntranceTweenRef.current?.kill()

    const sectionEls = Array.from(panel.querySelectorAll('.sm-panel-section')) as HTMLElement[]
    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[]
    const dividerEls = Array.from(panel.querySelectorAll('.sm-item-divider')) as HTMLElement[]
    const numberEls = Array.from(
      panel.querySelectorAll('.sm-panel-section[data-numbering] .sm-panel-item'),
    ) as HTMLElement[]
    const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[]

    const layerStates = layers.map((el) => ({
      el,
      start: Number(gsap.getProperty(el, 'xPercent')),
    }))
    const panelStart = Number(gsap.getProperty(panel, 'xPercent'))

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 8, opacity: 0 })
    if (dividerEls.length)
      gsap.set(dividerEls, { opacity: 0, scaleX: 0, transformOrigin: '0% 50%' })
    if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 } as gsap.TweenVars)
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 })
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 })

    const tl = gsap.timeline({ paused: true })

    for (const [i, ls] of layerStates.entries()) {
      tl.fromTo(
        ls.el,
        { xPercent: ls.start },
        { xPercent: 0, duration: 0.55, ease: 'power4.out' },
        i * 0.07,
      )
    }

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0)
    const panelDuration = 0.7

    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime,
    )

    if (sectionEls.length || itemEls.length) {
      const itemsStartRatio = 0.18
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio

      // Animate every section simultaneously with a graceful, cinematic reveal
      if (sectionEls.length) {
        for (const sec of sectionEls) {
          const secItemEls = Array.from(
            sec.querySelectorAll('.sm-panel-itemLabel'),
          ) as HTMLElement[]
          if (secItemEls.length) {
            tl.to(
              secItemEls,
              {
                yPercent: 0,
                rotate: 0,
                opacity: 1,
                duration: 1.4,
                ease: 'power3.out',
                stagger: { each: 0.14, from: 'start' },
              },
              itemsStart,
            )
          }
        }
      } else if (itemEls.length) {
        tl.to(
          itemEls,
          {
            yPercent: 0,
            rotate: 0,
            opacity: 1,
            duration: 1.4,
            ease: 'power3.out',
            stagger: { each: 0.14, from: 'start' },
          },
          itemsStart,
        )
      }

      if (dividerEls.length) {
        tl.to(
          dividerEls,
          {
            opacity: 1,
            scaleX: 1,
            duration: 0.75,
            ease: 'power3.out',
            stagger: 0.08,
          },
          itemsStart + 0.15,
        )
      }

      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: 'power2.out',
            '--sm-num-opacity': 1,
          } as gsap.TweenVars,
          itemsStart + 0.1,
        )
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4

      if (socialTitle)
        tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart)
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: 'opacity' })
            },
          },
          socialsStart + 0.04,
        )
      }
    }

    openTlRef.current = tl
    return tl
  }, [])

  const playOpen = useCallback(() => {
    if (busyRef.current) return
    busyRef.current = true
    const tl = buildOpenTimeline()
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false
      })
      tl.play(0)
    } else {
      busyRef.current = false
    }
  }, [buildOpenTimeline])

  const playClose = useCallback(() => {
    openTlRef.current?.kill()
    openTlRef.current = null
    itemEntranceTweenRef.current?.kill()

    const panel = panelRef.current
    const layers = preLayerElsRef.current
    if (!panel) return

    const all: HTMLElement[] = [...layers, panel]
    closeTweenRef.current?.kill()

    const offscreen = position === 'left' ? -100 : 100

    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[]
        const dividerEls = Array.from(panel.querySelectorAll('.sm-item-divider')) as HTMLElement[]
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 8, opacity: 0 })
        if (dividerEls.length) gsap.set(dividerEls, { opacity: 0, scaleX: 0 })

        const numberEls = Array.from(
          panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'),
        ) as HTMLElement[]
        if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 } as gsap.TweenVars)

        const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null
        const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[]
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 })
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 })

        busyRef.current = false
      },
    })
  }, [position])

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current
    const h = plusHRef.current
    const v = plusVRef.current
    if (!icon || !h || !v) return

    spinTweenRef.current?.kill()

    if (opening) {
      gsap.to(h, { rotation: 45, xPercent: -50, yPercent: -50, duration: 0.5, ease: 'power4.out' })
      gsap.to(v, { rotation: -45, xPercent: -50, yPercent: -50, duration: 0.5, ease: 'power4.out' })
    } else {
      gsap.to(h, {
        rotation: 0,
        xPercent: -50,
        yPercent: -50,
        duration: 0.35,
        ease: 'power3.inOut',
      })
      gsap.to(v, {
        rotation: 90,
        xPercent: -50,
        yPercent: -50,
        duration: 0.35,
        ease: 'power3.inOut',
      })
    }
  }, [])

  const getButtonColor = useCallback(
    (isOpen: boolean) => {
      if (!mounted) return '#111111'
      return isOpen ? (isDark ? '#ffffff' : '#000000') : isDark ? '#e9e9ef' : '#111111'
    },
    [mounted, isDark],
  )

  const animateColor = useCallback(
    (opening: boolean) => {
      const btn = toggleBtnRef.current
      if (!btn) return
      colorTweenRef.current?.kill()
      if (changeMenuColorOnOpen) {
        const targetColor = opening
          ? mounted && isDark
            ? '#ffffff'
            : '#000000'
          : mounted && isDark
            ? '#e9e9ef'
            : '#111111'
        colorTweenRef.current = gsap.to(btn, {
          color: targetColor,
          delay: 0.18,
          duration: 0.3,
          ease: 'power2.out',
        })
      } else {
        gsap.set(btn, { color: mounted && isDark ? '#e9e9ef' : '#111111' })
      }
    },
    [changeMenuColorOnOpen, mounted, isDark],
  )

  React.useEffect(() => {
    if (toggleBtnRef.current) {
      const targetColor = getButtonColor(openRef.current)
      gsap.set(toggleBtnRef.current, { color: targetColor })
    }
  }, [getButtonColor])

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current
    if (!inner) return

    textCycleAnimRef.current?.kill()

    const currentLabel = opening ? 'Menu' : 'Close'
    const targetLabel = opening ? 'Close' : 'Menu'
    const cycles = 3

    const seq: string[] = [currentLabel]
    let last = currentLabel
    for (let i = 0; i < cycles; i++) {
      last = last === 'Menu' ? 'Close' : 'Menu'
      seq.push(last)
    }
    if (last !== targetLabel) seq.push(targetLabel)
    seq.push(targetLabel)

    setTextLines(seq)
    gsap.set(inner, { yPercent: 0 })

    const lineCount = seq.length
    const finalShift = ((lineCount - 1) / lineCount) * 100

    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: 'power4.out',
    })
  }, [])

  const toggleMenu = useCallback(() => {
    const target = !openRef.current
    openRef.current = target
    setOpen(target)

    if (target) {
      onMenuOpen?.()
      playOpen()
    } else {
      onMenuClose?.()
      playClose()
    }

    animateIcon(target)
    animateColor(target)
    animateText(target)
  }, [playOpen, playClose, animateIcon, animateColor, animateText, onMenuOpen, onMenuClose])

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false
      setOpen(false)
      onMenuClose?.()
      playClose()
      animateIcon(false)
      animateColor(false)
      animateText(false)
    }
  }, [playClose, animateIcon, animateColor, animateText, onMenuClose])

  React.useEffect(() => {
    if (!closeOnClickAway || !open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        closeMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [closeOnClickAway, open, closeMenu])

  return (
    <div
      className={`sm-scope z-40 ${
        // `100dvh`, not `100vh` - on a real phone the address bar can still be
        // showing when the menu opens, and `vh` is sized against the viewport
        // with the bar hidden. Anything pinned near the bottom of a `100vh` box
        // (the theme toggle here) then renders behind the bar. `dvh` tracks the
        // actually-visible viewport instead. Chrome DevTools' device emulation
        // doesn't reproduce the bar's show/hide behavior, which is why this
        // never showed up there.
        isFixed ? 'fixed top-0 left-0 w-screen h-dvh' : 'w-full h-full'
      } pointer-events-none`}
    >
      <div
        className={`${className ? `${className} ` : ''}staggered-menu-wrapper pointer-events-none relative w-full h-full z-40`}
        style={{
          ['--sm-accent' as keyof React.CSSProperties]: accentColor,
          ['--sm-bg' as keyof React.CSSProperties]: mounted && isDark ? '#0b0b0f' : '#ffffff',
          ['--sm-fg' as keyof React.CSSProperties]: mounted && isDark ? '#f5f5f5' : '#000000',
          ['--sm-muted' as keyof React.CSSProperties]: mounted && isDark ? '#c2c2c2' : '#111111',
        }}
        data-position={position}
        data-open={open || undefined}
      >
        <div
          ref={preLayersRef}
          className="sm-prelayers absolute top-0 right-0 bottom-0 pointer-events-none z-[5]"
          aria-hidden="true"
        >
          {(() => {
            const raw = colors?.length ? colors.slice(0, 4) : ['#1e1e22', '#35353c']
            const arr = [...raw]
            if (arr.length >= 3) {
              const mid = Math.floor(arr.length / 2)
              arr.splice(mid, 1)
            }
            return arr.map((c, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: safe for static segments
                key={i}
                className="sm-prelayer absolute top-0 right-0 h-full w-full translate-x-0"
                style={{ background: c }}
              />
            ))
          })()}
        </div>

        <header
          className="staggered-menu-header absolute top-0 left-0 w-full flex items-center justify-between px-4 h-[60px] md:h-auto md:px-8 md:py-6 bg-transparent pointer-events-none z-20"
          aria-label="Main navigation header"
        >
          <div
            className="sm-logo flex items-center select-none pointer-events-auto"
            aria-label="Logo"
          >
            <img
              src={logoSrc}
              alt="Logo"
              className="sm-logo-img block h-8 w-auto object-contain"
              draggable={false}
              width={110}
              height={24}
            />
          </div>

          <button
            ref={toggleBtnRef}
            className={
              'sm-toggle relative inline-flex items-center gap-[0.3rem] bg-transparent border-0 cursor-pointer font-medium leading-none overflow-visible pointer-events-auto'
            }
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="staggered-menu-panel"
            onClick={toggleMenu}
            type="button"
            style={{
              color: open
                ? openMenuButtonColor || (mounted && isDark ? '#ffffff' : '#111111')
                : menuButtonColor || (mounted && isDark ? '#e9e9ef' : '#111111'),
            }}
          >
            <span
              ref={textWrapRef}
              className="sm-toggle-textWrap relative inline-block h-[1.2em] overflow-hidden whitespace-nowrap w-[var(--sm-toggle-width,auto)] min-w-[var(--sm-toggle-width,auto)]"
              aria-hidden="true"
            >
              <span ref={textInnerRef} className="sm-toggle-textInner flex flex-col leading-none">
                {textLines.map((l, i) => (
                  <span
                    className="sm-toggle-line block h-[1.2em] overflow-hidden leading-[1.2]"
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed two-line toggle text stack
                    key={i}
                  >
                    {l}
                  </span>
                ))}
              </span>
            </span>

            <span
              ref={iconRef}
              className="sm-icon relative w-[14px] h-[14px] shrink-0 inline-flex items-center justify-center [will-change:transform]"
              aria-hidden="true"
            >
              <span
                ref={plusHRef}
                className="sm-icon-line absolute left-1/2 top-1/2 w-full h-[2.5px] bg-current rounded-[2px] [will-change:transform]"
              />
              <span
                ref={plusVRef}
                className="sm-icon-line sm-icon-line-v absolute left-1/2 top-1/2 w-full h-[2.5px] bg-current rounded-[2px] [will-change:transform]"
              />
            </span>
          </button>
        </header>

        <aside
          id="staggered-menu-panel"
          ref={panelRef}
          className="staggered-menu-panel absolute top-0 right-0 h-full flex flex-col p-[6em_2em_2em_2em] overflow-y-auto z-10 backdrop-blur-[12px] pointer-events-auto"
          style={{
            WebkitBackdropFilter: 'blur(12px)',
            background: 'var(--sm-bg,#fff)',
            color: 'var(--sm-fg,#000)',
          }}
          aria-hidden={!open}
        >
          <div className="sm-panel-inner flex-1 flex flex-col gap-3">
            <div className="sm-panel-sections flex flex-col gap-0">
              {sectionGroups.length ? (
                sectionGroups.map((group, gIdx) => (
                  <React.Fragment key={group[0]?.link || gIdx}>
                    <ul
                      className="sm-panel-section sm-panel-list list-none m-0 p-0 flex flex-col gap-1"
                      data-numbering={displayItemNumbering || undefined}
                    >
                      {group.map((it) => (
                        <li
                          key={it.link || it.label}
                          className="sm-panel-itemWrap relative overflow-hidden leading-[1.15]"
                        >
                          <a
                            className="sm-panel-item relative font-semibold cursor-pointer leading-[1.15] uppercase transition-colors duration-150 ease-linear flex items-center no-underline"
                            href={it.link}
                            aria-label={it.ariaLabel}
                          >
                            <span className="sm-panel-itemLabel flex items-center gap-3 sm:gap-4 [transform-origin:50%_100%] will-change-transform">
                              {it.icon && (
                                <span className="sm-item-icon inline-flex items-center justify-center shrink-0">
                                  <it.icon className="h-6 w-6 sm:h-7 sm:w-7 stroke-[1.8]" />
                                </span>
                              )}
                              <span className="sm-item-text">{it.label}</span>
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                    {gIdx < sectionGroups.length - 1 && (
                      <div
                        className="sm-item-divider my-2 h-[1px] w-full"
                        style={{
                          background:
                            mounted && isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </React.Fragment>
                ))
              ) : (
                <div className="sm-panel-itemWrap relative overflow-hidden leading-[1.15]">
                  <span className="sm-panel-item relative text-black font-semibold text-[2rem] cursor-pointer uppercase inline-block no-underline">
                    <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                      No items
                    </span>
                  </span>
                </div>
              )}
            </div>

            {displaySocials && socialItems && socialItems.length > 0 && (
              <div
                className="sm-socials mt-auto pt-8 flex flex-col gap-3"
                aria-label="Social links"
              >
                <h3 className="sm-socials-title m-0 text-base font-medium [color:var(--sm-accent,#ff0000)]">
                  Socials
                </h3>
                <ul className="sm-socials-list list-none m-0 p-0 flex flex-row items-center gap-4 flex-wrap">
                  {socialItems.map((s, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed layout
                    <li key={s.label + i} className="sm-socials-item">
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm-socials-link text-[1.2rem] font-medium no-underline relative inline-block py-[2px] transition-[color,opacity] duration-300 ease-linear"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Theme toggle at bottom left */}
            <div className="sm-theme-toggle-wrapper mt-auto pt-6">
              <button
                className="sm-theme-toggle inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200"
                aria-label="Toggle color theme"
                type="button"
                onClick={toggleTheme}
                style={{
                  borderColor: mounted && isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                  background: mounted && isDark ? '#fff' : '#000',
                  color: mounted && isDark ? '#000' : '#fff',
                }}
              >
                {mounted && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
.sm-scope .staggered-menu-wrapper { position: relative; width: 100%; height: 100%; z-index: 40; pointer-events: none; }
.sm-scope .staggered-menu-header { position: absolute; top: 0; left: 0; width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 2em; background: transparent; pointer-events: none; z-index: 20; }
.sm-scope .staggered-menu-header > * { pointer-events: auto; }
.sm-scope .sm-logo { display: flex; align-items: center; user-select: none; }
.sm-scope .sm-logo-img { display: block; height: 32px; width: auto; object-fit: contain; }
.sm-scope .sm-toggle { position: relative; display: inline-flex; align-items: center; gap: 0.3rem; background: transparent; border: none; cursor: pointer; font-weight: 500; line-height: 1; overflow: visible; }
.sm-scope .sm-toggle:focus-visible { outline: 2px solid #ffffffaa; outline-offset: 4px; border-radius: 4px; }
.sm-scope .sm-line:last-of-type { margin-top: 6px; }
.sm-scope .sm-toggle-textWrap { position: relative; margin-right: 0.5em; display: inline-block; height: 1.2em; overflow: hidden; white-space: nowrap; width: var(--sm-toggle-width, auto); min-width: var(--sm-toggle-width, auto); }
.sm-scope .sm-toggle-textInner { display: flex; flex-direction: column; line-height: 1.2 !important; height: auto; }
/* height/line-height are 1.2em, not 1em: a tight 1em box clips the ascenders of
   this display font's rounded glyphs on some devices' font rasterizers (seen on
   real Android Chrome, never in desktop devtools device emulation - the two
   don't hint/rasterize custom webfonts identically). yPercent-based transforms
   elsewhere in this file are relative to each element's own box, so this stays
   in proportion automatically. */
.sm-scope .sm-toggle-line { display: block; height: 1.2em; line-height: 1.2 !important; overflow: hidden; }
.sm-scope .sm-icon { position: relative; width: 14px; height: 14px; flex: 0 0 14px; display: inline-flex; align-items: center; justify-content: center; will-change: transform; }
.sm-scope .sm-panel-itemWrap { position: relative; overflow: hidden; line-height: 1.15; }
.sm-scope .sm-icon-line { position: absolute; left: 50%; top: 50%; width: 100%; height: 2px; background: currentColor; border-radius: 2px; will-change: transform; }
.sm-scope .sm-line { display: none !important; }
.sm-scope .staggered-menu-panel { position: absolute; top: 0; right: 0; width: clamp(260px, 38vw, 420px); height: 100%; background: var(--sm-bg,#ffffff); color: var(--sm-fg,#000000); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; flex-direction: column; padding: 6em 2em 2em 2em; overflow-y: auto; z-index: 10; }
.sm-scope [data-position='left'] .staggered-menu-panel { right: auto; left: 0; }
.sm-scope .sm-prelayers { position: absolute; top: 0; right: 0; bottom: 0; width: clamp(260px, 38vw, 420px); pointer-events: none; z-index: 5; }
.sm-scope [data-position='left'] .sm-prelayers { right: auto; left: 0; }
.sm-scope .sm-prelayer { position: absolute; top: 0; right: 0; height: 100%; width: 100%; transform: translateX(0); }
.sm-scope .sm-panel-inner { flex: 1; display: flex; flex-direction: column; gap: 1.25rem; }
.sm-scope .sm-socials { margin-top: auto; padding-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
.sm-scope .sm-socials-title { margin: 0; font-size: 1rem; font-weight: 500; color: var(--sm-accent, #ff0000); }
.sm-scope .sm-socials-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: row; align-items: center; gap: 1rem; flex-wrap: wrap; }
.sm-scope .sm-socials-list .sm-socials-link { opacity: 1; transition: opacity 0.3s ease; }
.sm-scope .sm-socials-list:hover .sm-socials-link:not(:hover) { opacity: 0.35; }
.sm-scope .sm-socials-list:focus-within .sm-socials-link:not(:focus-visible) { opacity: 0.35; }
.sm-scope .sm-socials-list .sm-socials-link:hover,
.sm-scope .sm-socials-list .sm-socials-link:focus-visible { opacity: 1; }
.sm-scope .sm-socials-link:focus-visible { outline: 2px solid var(--sm-accent, #ff0000); outline-offset: 3px; }
.sm-scope .sm-socials-link { font-size: 1.2rem; font-weight: 500; color: var(--sm-fg,#000000); text-decoration: none; position: relative; padding: 2px 0; display: inline-block; transition: color 0.3s ease, opacity 0.3s ease; }
.sm-scope .sm-socials-link:hover { color: var(--sm-accent, #ff0000); }
.sm-scope .sm-panel-title { margin: 0; font-size: 1rem; font-weight: 600; color: #fff; text-transform: uppercase; }
.sm-scope .sm-panel-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.sm-scope .sm-panel-item { position: relative; color: var(--sm-fg,#000000); font-weight: 600; font-size: clamp(1.4rem, 4.2vw, 2.2rem); cursor: pointer; line-height: 1.2; letter-spacing: -0.5px; text-transform: uppercase; transition: color 0.2s ease; display: flex; align-items: center; text-decoration: none; padding: 0.2rem 0; }
.sm-scope .sm-panel-itemLabel { display: flex; align-items: center; will-change: transform; transform-origin: 50% 100%; width: 100%; }
.sm-scope .sm-item-icon { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--sm-muted, #888888); transition: color 0.2s ease, transform 0.2s ease; }
.sm-scope .sm-panel-item:hover .sm-item-icon,
.sm-scope .sm-panel-item:focus-visible .sm-item-icon { color: var(--sm-accent, #d98e4a); transform: scale(1.1); }
.sm-scope .sm-panel-item:hover,
.sm-scope .sm-panel-item:focus-visible { color: var(--sm-accent, #d98e4a); }
.sm-scope .sm-panel-list[data-numbering] { counter-reset: smItem; }
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item::after { counter-increment: smItem; content: counter(smItem, decimal-leading-zero); margin-left: auto; padding-right: 0.5rem; font-size: 14px; font-weight: 400; color: var(--sm-accent, #d98e4a); letter-spacing: 0; pointer-events: none; user-select: none; opacity: var(--sm-num-opacity, 0); }
@media (max-width: 1024px) { .sm-scope .staggered-menu-panel { width: 100%; left: 0; right: 0; padding: 5em 1.5em 2em 1.5em; } }
@media (max-width: 640px) { .sm-scope .staggered-menu-panel { width: 100%; left: 0; right: 0; padding: 4.5em 1.25em 2em 1.25em; } }
      `}</style>
    </div>
  )
}

export default StaggeredMenu
