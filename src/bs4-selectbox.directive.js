require('./bs4-selectbox.css')
require('./bs4-selectbox.module.js')

function uuidv4 () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0; var v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

angular.module('bs4-selectbox')

  .directive('bs4Selectbox', function ($resource) {
    return {
      restrict: 'E',
      template: require('./bs4-selectbox.directive.html'),
      scope: {
        options: '=?', // must be array of objects or a function that returns an array of objects
        // model: '=', // must be array of objects
        modelid: '=',
        search: '=?', // boolean (default = true)
        url: '=?',
        multiple: '@',
        searchAttrs: '@',
        key: '@',
        callback: '=?', // callback to be called on change
        placeholder: '@',
        limit: '=?' // limit if options are lazy loaded
      },
      transclude: true,
      // bindToController: true,
      // controllerAs: 'bs4SelectboxCtrl',
      // controller: bs4SelectboxController,
      link: function ($scope, el, attrs, ctrl) {
        ctrl = $scope

        oooo = this
        ctrl.searchTerms = ''
        $scope.item = {}
        ctrl.uuid = uuidv4()

        ctrl.available = available
        ctrl.change = change
        ctrl.select = select
        ctrl.deselect = deselect
        ctrl.keydown = keydown
        ctrl.itemkeydown = itemkeydown
        ctrl.focus = focus
        ctrl.$onDestroy = $onDestroy

        $scope.$watchCollection('modelid', function (oldValue, newValue) {
          if (ctrl.options ) {
            if (ctrl.multiple) {
              ctrl.modelid = ctrl.modelid.map(function(el) {return parseFloat(el)})
              $scope.items = ctrl.options.filter(function (el) { return  ctrl.modelid.indexOf(el.id) >= 0 })
            }
            else
            {
              
              $scope.item = ctrl.options.filter(function (el) { return el.id == parseFloat(ctrl.modelid) })[0]
            }
          }
          
        })
        if (ctrl.url) {
          var R = $resource(ctrl.url)
          R.query(function (data) {
            ctrl.options = JSON.parse(angular.toJson(data))
            $scope.inicializar()
          })
        } else {
          $scope.$watch('options', function (newValue, oldValue) {
            $scope.inicializar()
          }, true)
        }

        $scope.inicializar = function () {
        /* # todavía no está definido */
          if (!$scope.options) { return }
          if (!Array.isArray($scope.options)) // pasa en algunos modulos legacy
          { return }

         if (ctrl.options instanceof Array) {
            ctrl._options = ctrl.options
          } else {
            ctrl.options(ctrl.searchTerms, function (options) {
              ctrl._options = options
              if (options.length === 0) checkLater()
              $scope.$apply()
            })
          }

          if (ctrl.search === undefined) {
            ctrl.search = true // default true
          }
        }

        function $onDestroy () {
          ctrl.container.off('shown.bs.dropdown')
        }

        function search (obj) {
          if (!ctrl.searchAttrs) {
            throw new Error('You must specify the search-attrs (potentially comma separated list) for the search in bs4-selectbox to work properly.')
          }

          const searchAttrs = ctrl.searchAttrs.split(',').map(s => s.trim())
          const terms = ctrl.searchTerms.toLowerCase()

          let found = false
          for (const attr of searchAttrs) {
            let value = obj[attr]

            if (value) {
              if (typeof value === 'string') {
                value = value.toLowerCase()
              } else {
                value = value.toString().toLowerCase()
              }

              if (value.indexOf(terms) !== -1) {
                found = true
                break
              }
            }
          }

          return found
        }

        function available (option) {
          return !ctrl.searchTerms || search(option)
        }

        function focus () {
          setTimeout(function () {
            const input = document.querySelector('#bs4-selectbox-' + ctrl.uuid + '-input')
            input.focus()
          })
        }

        function select (evt, option) {
          if (ctrl.multiple) {
            ctrl.modelid.push(option.id)
            $scope.items.push(ctrl.options.filter(function(el){return el.id==option.id})[0])
          } else {
            $scope.item = option
            ctrl.modelid = option.id
          }

          ctrl.searchTerms = ''

          evt.preventDefault()
          // keep focus
          focus()

          ctrl.callback && ctrl.callback('add', option, this.model, evt)
        }

        function deselect (evt, option) {
          if (!ctrl.multiple) {
            $scope.item = {}
          }
          else{
            ctrl.items = ctrl.items.filter(function(el){return el.id!=option.id})
          }

          if (ctrl.multiple) {
            ctrl.modelid = ctrl.modelid.filter(function(el){return el!=option.id})
          } else {
            ctrl.modelid = ctrl.model[0].id
          }
          evt.stopPropagation()

          ctrl.callback && ctrl.callback('remove', option, this.model, evt)
        }

        function keydown (evt) {
          if (evt.keyCode === 40) {
          // Select first element
            const items = document.querySelector('#bs4-selectbox-' + ctrl.uuid + '-menu').children
            items.length > 1 && items[1] && items[1].focus()
          }
        }

        function itemkeydown (evt, i) {
          if (evt.keyCode === 38 && i === 0) {
          // Select input
            document.querySelector('#bs4-selectbox-' + ctrl.uuid + '-input').focus()
          }
        }

        let debouncing = false
        function change () {
          if (debouncing) return
          debouncing = true

          setTimeout(function () {
            if (ctrl.options instanceof Function) {
              ctrl.options(ctrl.searchTerms, function (options) {
                ctrl._options = options
                $scope.$apply()
              })
            }

            debouncing = false
          }, 250)
        }

        // Sometimes options cannot return before some other stuff has been initialized
        // Loop and check periodically until there is some data.
        function checkLater () {
          setTimeout(function () {
            ctrl.options(ctrl.searchTerms, function (options) {
              ctrl._options = options
              if (options.length === 0) checkLater()
              $scope.$apply()
            })
          }, 1000)
        }
      }
    }
  })

bs4SelectboxController.$inject = ['$scope', '$resource']

function bs4SelectboxController ($scope, $resource) {

}
