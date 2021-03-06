(function () {
  'use strict';

  /**
  * Name: angular-gsapify-router
  * Description: Angular UI-Router animation directive allowing configuration of state transitions using [GSAP](http://www.greensock.com/gsap-js/)
  * Author: jameshomer85@gmail.com
  * Licence: MIT
  * Usage: http://github.com/homerjam/angular-gsapify-router
  */

  angular.module('hj.gsapifyRouter', ['ui.router', 'ngAnimate'])

    .constant('TweenMax', TweenMax)

    .provider('gsapifyRouter', function () {
      var self = this;

      self.initialTransitionEnabled = false;

      self.transitions = {};

      self.transitions.above = {
        duration: 1,
        ease: 'Quart.easeInOut',
        css: {
          y: '-100%',
        },
      };

      self.transitions.below = {
        duration: 1,
        ease: 'Quart.easeInOut',
        css: {
          y: '100%',
        },
      };

      self.transitions.left = {
        duration: 1,
        ease: 'Quint.easeInOut',
        css: {
          x: '-100%',
        },
      };

      self.transitions.right = {
        duration: 1,
        ease: 'Quint.easeInOut',
        css: {
          x: '100%',
        },
      };

      self.transitions.fade = {
        duration: 0.5,
        css: {
          opacity: 0,
        },
      };

      self.transitions.fadeDelayed = {
        duration: 0.5,
        delay: 0.5,
        css: {
          opacity: 0,
        },
      };

      self.transitions.none = {
        duration: 0,
        css: {},
      };

      self.defaults = {
        enter: 'none',
        leave: 'none',
      };

      self.transition = function (transitionName, transitionOptions) {
        self.transitions[transitionName] = transitionOptions;
      };

      self.$get = ['$rootScope', '$state', '$document', '$injector', '$timeout', '$q', '$log', 'TweenMax',
        function ($rootScope, $state, $document, $injector, $timeout, $q, $log, TweenMax) {
          var getOpts = function (state, view, enterLeave, inOut) {
            var opts = {
              transition: self.defaults[inOut === 'in' ? 'enter' : 'leave'],
              priority: 0,
            };

            if (state.data) {
              if (state.data['gsapifyRouter.' + view] && state.data['gsapifyRouter.' + view][enterLeave]) {
                if (state.data['gsapifyRouter.' + view][enterLeave][inOut]) {
                  switch (Object.prototype.toString.call(state.data['gsapifyRouter.' + view][enterLeave][inOut])) {
                    case '[object Array]':
                    case '[object Function]':
                      opts = $injector.invoke(state.data['gsapifyRouter.' + view][enterLeave][inOut]);
                      break;
                    case '[object Object]':
                      opts = angular.extend(opts, state.data['gsapifyRouter.' + view][enterLeave][inOut]);
                      Object.keys(opts).forEach(function (key) {
                        switch (Object.prototype.toString.call(opts[key])) {
                          case '[object Array]':
                          case '[object Function]':
                            opts[key] = $injector.invoke(opts[key]);
                            break;
                        }
                      });
                      break;
                    case '[object String]':
                      opts.transition = state.data['gsapifyRouter.' + view][enterLeave][inOut];
                      break;
                  }
                }
              }
            }

            return opts;
          };

          var getTransition = function (transition) {
            var result;
            switch (Object.prototype.toString.call(transition)) {
              case '[object Object]':
                result = transition;
                break;
              case '[object String]':
                result = self.transitions[transition];
                break;
            }
            return result;
          };

          var enter = function (element) {
            var deferred = $q.defer();

            element.css('visibility', 'hidden');

            element.addClass('gsapify-router-in-setup');

            var view = element.attr('ui-view') || element.attr('data-ui-view');

            var current = $state.current;
            var previous = $state.previous;

            var currentOpts = getOpts(current, view, 'enter', 'in');
            var previousOpts = getOpts(previous, view, 'leave', 'in');

            var from;

            if (previousOpts.priority > currentOpts.priority) {
              from = previousOpts;

            } else {
              from = currentOpts;
            }

            var trigger = from.trigger || getOpts(previous, view, 'leave', 'out').trigger;

            var transition = getTransition(from.transition);

            if (!transition) {
              return $log.error("gsapifyRouter: Invalid transition '" + transition + "'");
            }

            var duration = transition.duration;
            var vars = angular.copy(transition);

            vars.onStart = function () {
              element.css('visibility', 'visible');

              element.removeClass('gsapify-router-in-setup');
              element.addClass('gsapify-router-in');
            };

            vars.onComplete = function () {
              element.addClass('gsapify-router-in-end');

              deferred.resolve({
                element: element,
                view: view,
              });
            };

            if (!vars.css || Object.keys(vars.css).length === 0 || duration === 0) {
              vars.onStart();
            }

            if (trigger) {
              var triggerEvent = $rootScope.$on(trigger, function () {
                triggerEvent();

                TweenMax.from(element, duration, vars);
              });

            } else {
              TweenMax.from(element, duration, vars);
            }

            return deferred.promise;
          };

          var leave = function (element) {
            var deferred = $q.defer();

            element.removeClass('gsapify-router-in gsapify-router-in-end');
            element.addClass('gsapify-router-out-setup');

            var view = element.attr('ui-view') || element.attr('data-ui-view');

            var current = $state.current;
            var previous = $state.previous;

            var previousOpts = getOpts(previous, view, 'leave', 'out');
            var currentOpts = getOpts(current, view, 'enter', 'out');

            var to;

            if (currentOpts.priority > previousOpts.priority) {
              to = currentOpts;

            } else {
              to = previousOpts;
            }

            var trigger = to.trigger || getOpts(current, view, 'enter', 'in').trigger;

            var transition = getTransition(to.transition);

            if (!transition) {
              return $log.error("gsapifyRouter: Invalid transition '" + transition + "'");
            }

            var duration = transition.duration;
            var vars = angular.copy(transition);

            vars.onStart = function () {
              element.removeClass('gsapify-router-out-setup');
              element.addClass('gsapify-router-out');
            };

            vars.onComplete = function () {
              element.remove();

              deferred.resolve({
                element: element,
                view: view,
              });
            };

            if (trigger) {
              var triggerEvent = $rootScope.$on(trigger, function () {
                triggerEvent();

                TweenMax.to(element, duration, vars);
              });

            } else {
              TweenMax.to(element, duration, vars);
            }

            return deferred.promise;
          };

          return {
            enter: enter,
            leave: leave,
            transitions: self.transitions,
            defaults: self.defaults,
            initialTransitionEnabled: self.initialTransitionEnabled,
          };
        },
      ];
    })

    .config(['$stateProvider', function ($stateProvider) {
      $stateProvider.state('gsapifyRouterBlankState', {});
    }])

    .run(['$rootScope', '$state', 'gsapifyRouter', '$timeout', function ($rootScope, $state, gsapifyRouter, $timeout) {
      $state.history = [];
      $state.previous = {};

      $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        $state.previous = fromState;
        $state.previousParams = fromParams;

        $state.history.push({
          name: fromState.name,
          params: fromParams,
        });
      });

      if (gsapifyRouter.initialTransitionEnabled) {
        $timeout(function () {
          var initialState = [$state.current.name, $state.current.params];

          $state.go('gsapifyRouterBlankState');

          $timeout(function () {
            $state.go.apply(null, initialState);

            $timeout(function () {
              gsapifyRouter.initialTransitionEnabled = false;
            });
          });
        });
      }
    }])

    .directive('gsapifyRouter', ['$state',
      function ($state) {
        return {
          priority: 0,
          restrict: 'C',
          link: function ($scope, $element, $attr) {
            $attr.$set('data-state', $state.current.name);
          },
        };
      },
    ])

    .animation('.gsapify-router', ['$rootScope', 'gsapifyRouter',
      function ($rootScope, gsapifyRouter) {
        return {
          enter: function (element, done) {
            var state = element.attr('data-state');

            if (state !== 'gsapifyRouterBlankState') {
              $rootScope.$broadcast('gsapifyRouter:enterStart', element);

              gsapifyRouter.enter(element).then(function (obj) {
                $rootScope.$broadcast('gsapifyRouter:enterSuccess', element, obj);

                done();
              });
            }

            return function (cancelled) {
              // Backwards compatibility with angular 1.3.x and below
              if (angular.version.major === 1 && angular.version.minor <= 3) {
                if (cancelled === true) {
                  element.remove();
                }

                return;
              }

              if (cancelled !== false) {
                element.remove();
              }
            };
          },
          leave: function (element, done) {
            var state = element.attr('data-state');

            if (state !== 'gsapifyRouterBlankState') {
              $rootScope.$broadcast('gsapifyRouter:leaveStart', element);

              gsapifyRouter.leave(element).then(function (obj) {
                $rootScope.$broadcast('gsapifyRouter:leaveSuccess', element, obj);

                done();
              });
            }
          },
        };
      },
    ]);

})();
