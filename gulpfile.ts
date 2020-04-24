/*!
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
'use strict';

import { FSWatcher } from 'fs';

import gulp from 'gulp';
import del from 'del';
import sourcemaps from 'gulp-sourcemaps';
import webpack from 'webpack';
import webpackStream from 'webpack-stream';
import named from 'vinyl-named';
import gulpSass from 'gulp-sass';

import webpackConfig from './webpack.config';

// ============================== //
//             Utils              //
// ============================== //

/** Array of functions to run on quit. */
const exitHandlers = new Set<() => Promise<void> | void>();

/**
 * Registers a function to be run when the proccess is quit.
 * Usefull for stopping and cleaning up watch tasks/servers.
 * @param handler
 */
function onExit(handler: () => Promise<void> | void): void {
    exitHandlers.add(handler);
}

// On Ctrl-C cleanup and exit
process.on('SIGINT', async () => {

    // Give them 2 seconds before forcibly quiting
    setTimeout(() => process.exit(130), 2000);

    // Notify all handlers
    for (const h of exitHandlers) await h();

});

/**
 * Closes the given watcher when the proccess is quit
 * @param watcher The watcher to close
 */
async function closeOnExit(watcher: FSWatcher): Promise<void> {
    return new Promise((resolve) => onExit(() => resolve(watcher.close())));
}

// ============================== //
//             Tasks              //
// ============================== //

/**
 * Cleans the build folders
 */
export function clean(): Promise<string[]> {
    return del("./dist");
}
clean.description = "Cleans the build folders";

/**
 * Compiles TypeScript files using webpack
 * @param watch If webpack should watch the files
 */
function compileTypescript(watch = false): NodeJS.ReadWriteStream {
    return gulp.src([
        "./src/scripts/main.ts"
    ])
        .pipe(named())
        .pipe(webpackStream({ watch, ...webpackConfig }, webpack))
        .pipe(gulp.dest('dist/scripts/'));
}

/**
 * Compiles TypeScript files
 */
export function typescript(): NodeJS.ReadWriteStream {
    return compileTypescript(false);
}
typescript.description = "Compiles TypeScript files";

/**
 * Compiles sass files
 */
export function sass(): NodeJS.ReadWriteStream {
    return gulp.src("./src/styles/**/*.scss")
        .pipe(sourcemaps.init())
        .pipe(gulpSass().on("error", gulpSass.logError))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("./dist/styles"));
}
sass.description = "Compiles sass files";

/**
 * Copies static files
 */
export function copy(): NodeJS.ReadWriteStream {
    return gulp.src(["./static/**/*"])
        .pipe(gulp.dest("./dist"));
}
copy.description = "Copies static files";

/**
 * Watches TypeScript files
 */
export function watchTypescript(): NodeJS.ReadWriteStream {
    return compileTypescript(true);
}
watchTypescript.description = "Watches TypeScript files";

/**
 * Watches sass files
 */
export async function watchSass(): Promise<void> {
    return closeOnExit(gulp.watch("./src/styles/**/*.scss", sass));
}
watchSass.description = "Watches sass files";

/**
 * Watches static files
 */
export function watchCopy(): Promise<void> {
    return closeOnExit(gulp.watch("./static/**/*", copy));
}
watchCopy.description = "Watches static files";

/**
 * Watches all files
 */
export const watch = gulp.parallel(watchSass, watchTypescript, watchCopy);
watch.description = "Watches all files";

/**
 * Builds all files
 */
export const build = gulp.parallel(sass, typescript);
build.description = "Builds all files";

const defaultTask = gulp.series(clean, copy, build);
defaultTask.description = "Builds and packages the app";
export default defaultTask;
