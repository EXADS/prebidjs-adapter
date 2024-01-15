# exadsBidAdapter
Exads PrebidJS Adapter

#### In order to mantain the adapter locally:

* Cloning locally the official prebidJS repository: https://github.com/prebid/Prebid.js.git
* Adding these new lines to gulpfile.js (change the paths accordly to your needs): 
```
// it will copy the compiled js file into another location (when you have your snippet code)
function copyFiles(dev) {
  if(dev) {
    return gulp.src('build/dev/prebid.js')
      .pipe(gulp.dest('../../../../sys-vagrocker/code/management/js/'));
  } else {
    return gulp.src('build/dist/prebid.js')
      .pipe(gulp.dest('../../../../sys-vagrocker/code/management/js/'));    
  }
}

gulp.task('build-with-adapter-dev', gulp.series(makeDevpackPkg, gulpBundle.bind(null, true), copyFiles.bind(null, true)));
gulp.task('build-with-adapter-prod', gulp.series(makeDevpackPkg, gulpBundle.bind(null, false), copyFiles.bind(null, false)));
```

at the end of the file before the last line
```
module.exports = nodeBundle;
```

* Changing the adapter that you can find into ./Prebid.js/modules (if it was already deployed into the official prebidJS repository)
* Updating the unit tests, they are into ./Prebid.js/test/spec/modules
* Running tlint and unit tests (to see the specific paragraph)
* Doing manual tests (to see the specific paragraph)
* Merging the new version of the adapter with prebidJS library running 
* `build-with-adapter-dev  --modules=consentManagement,exadsBidAdapter` for development environments
* `build-with-adapter-prod  --modules=consentManagement,exadsBidAdapter` for production environments
* After that we can use the resulting prebidJS adapter. You can find it into 
* `./build/dev/prebid.js` if you have runned `build-with-adapter-dev`
* `./build/dist/prebid.js` if you have runned `build-with-adapter-prod`
* Updating the snippet code. You can find it into this repository: ./snippet-code-examples

#### Lint and Unit tests
* Run `gulp test`
* Note: lint checks the official prebidJS rules.
* Also, to do the pull request to official prebidJS team, it is mondatory 80% or more of covarage

#### Manual tests
* Advisable location to test the adapter is the www-management repository: https://github.com/EXADS/www-management.git
* Cloning the repository locally
* Copying all examples snippet codes into the root path of management
* Copying the prebidJS library containing the new changes of the adapter
* Commenting the `<script async src="js/prebid.js"></script>` into the example snippet code
* Navigating to https://management.exads.rocks/{snippet_code.html}

#### Environments (development and production) - Changes to do into the snippet code
* Set isEnabledDebug global variable (If it is true, you will be able to see logs)
* 
* For development environments
```
    <!-- Uncomment for development environments -->
    <script src="js/prebid.js"></script>
    <!-- Remove this line -->
    <script async src="js/prebid.js" onload="onScriptLoaded()"></script>
```
* For production environments
```
    <!-- Remove this line -->
    <script src="js/prebid.js"></script>
    <!-- Uncomment for production environments -->
    <script async src="js/prebid.js" onload="onScriptLoaded()"></script>
```
