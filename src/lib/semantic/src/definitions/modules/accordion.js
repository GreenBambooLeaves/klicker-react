/*!
 * # Semantic UI - Accordion
 * http://github.com/semantic-org/semantic-ui/
 *
 *
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */

(function ($, window, document, undefined) {
  window =
    typeof window !== 'undefined' && window.Math == Math
      ? window
      : typeof self !== 'undefined' && self.Math == Math
        ? self
        : Function('return this')()

  $.fn.accordion = function (parameters) {
    let $allModules = $(this),
      time = new Date().getTime(),
      performance = [],
      query = arguments[0],
      methodInvoked = typeof query === 'string',
      queryArguments = [].slice.call(arguments, 1),
      requestAnimationFrame =
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
          setTimeout(callback, 0)
        },
      returnedValue
    $allModules.each(function () {
      let settings = $.isPlainObject(parameters)
          ? $.extend(true, {}, $.fn.accordion.settings, parameters)
          : $.extend({}, $.fn.accordion.settings),
        className = settings.className,
        namespace = settings.namespace,
        selector = settings.selector,
        error = settings.error,
        eventNamespace = `.${namespace}`,
        moduleNamespace = `module-${namespace}`,
        moduleSelector = $allModules.selector || '',
        $module = $(this),
        $title = $module.find(selector.title),
        $content = $module.find(selector.content),
        element = this,
        instance = $module.data(moduleNamespace),
        observer,
        module

      module = {
        initialize() {
          module.debug('Initializing', $module)
          module.bind.events()
          if (settings.observeChanges) {
            module.observeChanges()
          }
          module.instantiate()
        },

        instantiate() {
          instance = module
          $module.data(moduleNamespace, module)
        },

        destroy() {
          module.debug('Destroying previous instance', $module)
          $module.off(eventNamespace).removeData(moduleNamespace)
        },

        refresh() {
          $title = $module.find(selector.title)
          $content = $module.find(selector.content)
        },

        observeChanges() {
          if ('MutationObserver' in window) {
            observer = new MutationObserver((mutations) => {
              module.debug('DOM tree modified, updating selector cache')
              module.refresh()
            })
            observer.observe(element, {
              childList: true,
              subtree: true,
            })
            module.debug('Setting up mutation observer', observer)
          }
        },

        bind: {
          events() {
            module.debug('Binding delegated events')
            $module.on(settings.on + eventNamespace, selector.trigger, module.event.click)
          },
        },

        event: {
          click() {
            module.toggle.call(this)
          },
        },

        toggle(query) {
          let $activeTitle =
              query !== undefined
                ? typeof query === 'number'
                  ? $title.eq(query)
                  : $(query).closest(selector.title)
                : $(this).closest(selector.title),
            $activeContent = $activeTitle.next($content),
            isAnimating = $activeContent.hasClass(className.animating),
            isActive = $activeContent.hasClass(className.active),
            isOpen = isActive && !isAnimating,
            isOpening = !isActive && isAnimating
          module.debug('Toggling visibility of content', $activeTitle)
          if (isOpen || isOpening) {
            if (settings.collapsible) {
              module.close.call($activeTitle)
            } else {
              module.debug('Cannot close accordion content collapsing is disabled')
            }
          } else {
            module.open.call($activeTitle)
          }
        },

        open(query) {
          let $activeTitle =
              query !== undefined
                ? typeof query === 'number'
                  ? $title.eq(query)
                  : $(query).closest(selector.title)
                : $(this).closest(selector.title),
            $activeContent = $activeTitle.next($content),
            isAnimating = $activeContent.hasClass(className.animating),
            isActive = $activeContent.hasClass(className.active),
            isOpen = isActive || isAnimating
          if (isOpen) {
            module.debug('Accordion already open, skipping', $activeContent)
            return
          }
          module.debug('Opening accordion content', $activeTitle)
          settings.onOpening.call($activeContent)
          settings.onChanging.call($activeContent)
          if (settings.exclusive) {
            module.closeOthers.call($activeTitle)
          }
          $activeTitle.addClass(className.active)
          $activeContent.stop(true, true).addClass(className.animating)
          if (settings.animateChildren) {
            if ($.fn.transition !== undefined && $module.transition('is supported')) {
              $activeContent.children().transition({
                animation: 'fade in',
                queue: false,
                useFailSafe: true,
                debug: settings.debug,
                verbose: settings.verbose,
                duration: settings.duration,
              })
            } else {
              $activeContent
                .children()
                .stop(true, true)
                .animate(
                  {
                    opacity: 1,
                  },
                  settings.duration,
                  module.resetOpacity,
                )
            }
          }
          $activeContent.slideDown(settings.duration, settings.easing, function () {
            $activeContent.removeClass(className.animating).addClass(className.active)
            module.reset.display.call(this)
            settings.onOpen.call(this)
            settings.onChange.call(this)
          })
        },

        close(query) {
          let $activeTitle =
              query !== undefined
                ? typeof query === 'number'
                  ? $title.eq(query)
                  : $(query).closest(selector.title)
                : $(this).closest(selector.title),
            $activeContent = $activeTitle.next($content),
            isAnimating = $activeContent.hasClass(className.animating),
            isActive = $activeContent.hasClass(className.active),
            isOpening = !isActive && isAnimating,
            isClosing = isActive && isAnimating
          if ((isActive || isOpening) && !isClosing) {
            module.debug('Closing accordion content', $activeContent)
            settings.onClosing.call($activeContent)
            settings.onChanging.call($activeContent)
            $activeTitle.removeClass(className.active)
            $activeContent.stop(true, true).addClass(className.animating)
            if (settings.animateChildren) {
              if ($.fn.transition !== undefined && $module.transition('is supported')) {
                $activeContent.children().transition({
                  animation: 'fade out',
                  queue: false,
                  useFailSafe: true,
                  debug: settings.debug,
                  verbose: settings.verbose,
                  duration: settings.duration,
                })
              } else {
                $activeContent
                  .children()
                  .stop(true, true)
                  .animate(
                    {
                      opacity: 0,
                    },
                    settings.duration,
                    module.resetOpacity,
                  )
              }
            }
            $activeContent.slideUp(settings.duration, settings.easing, function () {
              $activeContent.removeClass(className.animating).removeClass(className.active)
              module.reset.display.call(this)
              settings.onClose.call(this)
              settings.onChange.call(this)
            })
          }
        },

        closeOthers(index) {
          let $activeTitle =
              index !== undefined ? $title.eq(index) : $(this).closest(selector.title),
            $parentTitles = $activeTitle.parents(selector.content).prev(selector.title),
            $activeAccordion = $activeTitle.closest(selector.accordion),
            activeSelector = `${selector.title}.${className.active}:visible`,
            activeContent = `${selector.content}.${className.active}:visible`,
            $openTitles,
            $nestedTitles,
            $openContents
          if (settings.closeNested) {
            $openTitles = $activeAccordion.find(activeSelector).not($parentTitles)
            $openContents = $openTitles.next($content)
          } else {
            $openTitles = $activeAccordion.find(activeSelector).not($parentTitles)
            $nestedTitles = $activeAccordion
              .find(activeContent)
              .find(activeSelector)
              .not($parentTitles)
            $openTitles = $openTitles.not($nestedTitles)
            $openContents = $openTitles.next($content)
          }
          if ($openTitles.length > 0) {
            module.debug('Exclusive enabled, closing other content', $openTitles)
            $openTitles.removeClass(className.active)
            $openContents.removeClass(className.animating).stop(true, true)
            if (settings.animateChildren) {
              if ($.fn.transition !== undefined && $module.transition('is supported')) {
                $openContents.children().transition({
                  animation: 'fade out',
                  useFailSafe: true,
                  debug: settings.debug,
                  verbose: settings.verbose,
                  duration: settings.duration,
                })
              } else {
                $openContents
                  .children()
                  .stop(true, true)
                  .animate(
                    {
                      opacity: 0,
                    },
                    settings.duration,
                    module.resetOpacity,
                  )
              }
            }
            $openContents.slideUp(settings.duration, settings.easing, function () {
              $(this).removeClass(className.active)
              module.reset.display.call(this)
            })
          }
        },

        reset: {
          display() {
            module.verbose('Removing inline display from element', this)
            $(this).css('display', '')
            if ($(this).attr('style') === '') {
              $(this)
                .attr('style', '')
                .removeAttr('style')
            }
          },

          opacity() {
            module.verbose('Removing inline opacity from element', this)
            $(this).css('opacity', '')
            if ($(this).attr('style') === '') {
              $(this)
                .attr('style', '')
                .removeAttr('style')
            }
          },
        },

        setting(name, value) {
          module.debug('Changing setting', name, value)
          if ($.isPlainObject(name)) {
            $.extend(true, settings, name)
          } else if (value !== undefined) {
            if ($.isPlainObject(settings[name])) {
              $.extend(true, settings[name], value)
            } else {
              settings[name] = value
            }
          } else {
            return settings[name]
          }
        },
        internal(name, value) {
          module.debug('Changing internal', name, value)
          if (value !== undefined) {
            if ($.isPlainObject(name)) {
              $.extend(true, module, name)
            } else {
              module[name] = value
            }
          } else {
            return module[name]
          }
        },
        debug() {
          if (!settings.silent && settings.debug) {
            if (settings.performance) {
              module.performance.log(arguments)
            } else {
              module.debug = Function.prototype.bind.call(
                console.info,
                console,
                `${settings.name}:`,
              )
              module.debug.apply(console, arguments)
            }
          }
        },
        verbose() {
          if (!settings.silent && settings.verbose && settings.debug) {
            if (settings.performance) {
              module.performance.log(arguments)
            } else {
              module.verbose = Function.prototype.bind.call(
                console.info,
                console,
                `${settings.name}:`,
              )
              module.verbose.apply(console, arguments)
            }
          }
        },
        error() {
          if (!settings.silent) {
            module.error = Function.prototype.bind.call(console.error, console, `${settings.name}:`)
            module.error.apply(console, arguments)
          }
        },
        performance: {
          log(message) {
            let currentTime,
              executionTime,
              previousTime
            if (settings.performance) {
              currentTime = new Date().getTime()
              previousTime = time || currentTime
              executionTime = currentTime - previousTime
              time = currentTime
              performance.push({
                Name: message[0],
                Arguments: [].slice.call(message, 1) || '',
                Element: element,
                'Execution Time': executionTime,
              })
            }
            clearTimeout(module.performance.timer)
            module.performance.timer = setTimeout(module.performance.display, 500)
          },
          display() {
            let title = `${settings.name}:`,
              totalTime = 0
            time = false
            clearTimeout(module.performance.timer)
            $.each(performance, (index, data) => {
              totalTime += data['Execution Time']
            })
            title += ` ${totalTime}ms`
            if (moduleSelector) {
              title += ` '${moduleSelector}'`
            }
            if (
              (console.group !== undefined || console.table !== undefined) &&
              performance.length > 0
            ) {
              console.groupCollapsed(title)
              if (console.table) {
                console.table(performance)
              } else {
                $.each(performance, (index, data) => {
                  console.log(`${data.Name}: ${data['Execution Time']}ms`)
                })
              }
              console.groupEnd()
            }
            performance = []
          },
        },
        invoke(query, passedArguments, context) {
          let object = instance,
            maxDepth,
            found,
            response
          passedArguments = passedArguments || queryArguments
          context = element || context
          if (typeof query === 'string' && object !== undefined) {
            query = query.split(/[\. ]/)
            maxDepth = query.length - 1
            $.each(query, (depth, value) => {
              const camelCaseValue =
                depth != maxDepth
                  ? value + query[depth + 1].charAt(0).toUpperCase() + query[depth + 1].slice(1)
                  : query
              if ($.isPlainObject(object[camelCaseValue]) && depth != maxDepth) {
                object = object[camelCaseValue]
              } else if (object[camelCaseValue] !== undefined) {
                found = object[camelCaseValue]
                return false
              } else if ($.isPlainObject(object[value]) && depth != maxDepth) {
                object = object[value]
              } else if (object[value] !== undefined) {
                found = object[value]
                return false
              } else {
                module.error(error.method, query)
                return false
              }
            })
          }
          if ($.isFunction(found)) {
            response = found.apply(context, passedArguments)
          } else if (found !== undefined) {
            response = found
          }
          if ($.isArray(returnedValue)) {
            returnedValue.push(response)
          } else if (returnedValue !== undefined) {
            returnedValue = [returnedValue, response]
          } else if (response !== undefined) {
            returnedValue = response
          }
          return found
        },
      }
      if (methodInvoked) {
        if (instance === undefined) {
          module.initialize()
        }
        module.invoke(query)
      } else {
        if (instance !== undefined) {
          instance.invoke('destroy')
        }
        module.initialize()
      }
    })
    return returnedValue !== undefined ? returnedValue : this
  }

  $.fn.accordion.settings = {
    name: 'Accordion',
    namespace: 'accordion',

    silent: false,
    debug: false,
    verbose: false,
    performance: true,

    on: 'click', // event on title that opens accordion

    observeChanges: true, // whether accordion should automatically refresh on DOM insertion

    exclusive: true, // whether a single accordion content panel should be open at once
    collapsible: true, // whether accordion content can be closed
    closeNested: false, // whether nested content should be closed when a panel is closed
    animateChildren: true, // whether children opacity should be animated

    duration: 350, // duration of animation
    easing: 'easeOutQuad', // easing equation for animation

    onOpening() {}, // callback before open animation
    onClosing() {}, // callback before closing animation
    onChanging() {}, // callback before closing or opening animation

    onOpen() {}, // callback after open animation
    onClose() {}, // callback after closing animation
    onChange() {}, // callback after closing or opening animation

    error: {
      method: 'The method you called is not defined',
    },

    className: {
      active: 'active',
      animating: 'animating',
    },

    selector: {
      accordion: '.accordion',
      title: '.title',
      trigger: '.title',
      content: '.content',
    },
  }

  // Adds easing
  $.extend($.easing, {
    easeOutQuad(x, t, b, c, d) {
      return -c * (t /= d) * (t - 2) + b
    },
  })
}(jQuery, window, document))