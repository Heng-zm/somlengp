(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/ui/card.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Card": (()=>Card),
    "CardContent": (()=>CardContent),
    "CardDescription": (()=>CardDescription),
    "CardFooter": (()=>CardFooter),
    "CardHeader": (()=>CardHeader),
    "CardTitle": (()=>CardTitle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
;
const Card = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("rounded-lg border bg-card text-card-foreground shadow-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 9,
        columnNumber: 3
    }, this));
_c1 = Card;
Card.displayName = "Card";
const CardHeader = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c2 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col space-y-1.5 p-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 24,
        columnNumber: 3
    }, this));
_c3 = CardHeader;
CardHeader.displayName = "CardHeader";
const CardTitle = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-2xl font-semibold leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 36,
        columnNumber: 3
    }, this));
_c5 = CardTitle;
CardTitle.displayName = "CardTitle";
const CardDescription = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c6 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 51,
        columnNumber: 3
    }, this));
_c7 = CardDescription;
CardDescription.displayName = "CardDescription";
const CardContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c8 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 63,
        columnNumber: 3
    }, this));
_c9 = CardContent;
CardContent.displayName = "CardContent";
const CardFooter = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c10 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex items-center p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 71,
        columnNumber: 3
    }, this));
_c11 = CardFooter;
CardFooter.displayName = "CardFooter";
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "Card$React.forwardRef");
__turbopack_context__.k.register(_c1, "Card");
__turbopack_context__.k.register(_c2, "CardHeader$React.forwardRef");
__turbopack_context__.k.register(_c3, "CardHeader");
__turbopack_context__.k.register(_c4, "CardTitle$React.forwardRef");
__turbopack_context__.k.register(_c5, "CardTitle");
__turbopack_context__.k.register(_c6, "CardDescription$React.forwardRef");
__turbopack_context__.k.register(_c7, "CardDescription");
__turbopack_context__.k.register(_c8, "CardContent$React.forwardRef");
__turbopack_context__.k.register(_c9, "CardContent");
__turbopack_context__.k.register(_c10, "CardFooter$React.forwardRef");
__turbopack_context__.k.register(_c11, "CardFooter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/ui/textarea.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Textarea": (()=>Textarea)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
;
const Textarea = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', className),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/textarea.tsx",
        lineNumber: 8,
        columnNumber: 7
    }, this);
});
_c1 = Textarea;
Textarea.displayName = 'Textarea';
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Textarea$React.forwardRef");
__turbopack_context__.k.register(_c1, "Textarea");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/ai/flows/data:ffcb5a [app-client] (ecmascript) <text/javascript>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"404e7f9a1b53c619250992f00f30e177053aa089a2":"transcribePdf"},"src/ai/flows/pdf-transcript-flow.ts",""] */ __turbopack_context__.s({
    "transcribePdf": (()=>transcribePdf)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var transcribePdf = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("404e7f9a1b53c619250992f00f30e177053aa089a2", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "transcribePdf"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vcGRmLXRyYW5zY3JpcHQtZmxvdy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc2VydmVyJztcbi8qKlxuICogQGZpbGVPdmVydmlldyBBbiBBSSBhZ2VudCBmb3IgdHJhbnNjcmliaW5nIHRleHQgZnJvbSBQREYgZmlsZXMuXG4gKlxuICogLSB0cmFuc2NyaWJlUGRmIC0gQSBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgdGhlIFBERiB0byB0ZXh0IHRyYW5zY3JpcHRpb24gcHJvY2Vzcy5cbiAqIC0gVHJhbnNjcmliZVBkZklucHV0IC0gVGhlIGlucHV0IHR5cGUgZm9yIHRoZSBmdW5jdGlvbi5cbiAqIC0gVHJhbnNjcmliZVBkZk91dHB1dCAtIFRoZSByZXR1cm4gdHlwZSBmb3IgdGhlIGZ1bmN0aW9uLlxuICovXG5cbmltcG9ydCB7YWl9IGZyb20gJ0AvYWkvZ2Vua2l0JztcbmltcG9ydCB7Z29vZ2xlQUl9IGZyb20gJ0BnZW5raXQtYWkvZ29vZ2xlYWknO1xuaW1wb3J0IHt6fSBmcm9tICdnZW5raXQnO1xuXG5jb25zdCBUcmFuc2NyaWJlUGRmSW5wdXRTY2hlbWEgPSB6Lm9iamVjdCh7XG4gIHBkZkRhdGFVcmk6IHpcbiAgICAuc3RyaW5nKClcbiAgICAuZGVzY3JpYmUoXG4gICAgICBcIkEgUERGIGZpbGUsIGFzIGEgZGF0YSBVUkkgdGhhdCBtdXN0IGluY2x1ZGUgYSBNSU1FIHR5cGUgYW5kIHVzZSBCYXNlNjQgZW5jb2RpbmcuIEV4cGVjdGVkIGZvcm1hdDogJ2RhdGE6YXBwbGljYXRpb24vcGRmO2Jhc2U2NCw8ZW5jb2RlZF9kYXRhPidcIlxuICAgICksXG4gIG1vZGVsOiB6XG4gICAgLnN0cmluZygpXG4gICAgLm9wdGlvbmFsKClcbiAgICAuZGVzY3JpYmUoJ1RoZSBBSSBtb2RlbCB0byB1c2UgZm9yIHRyYW5zY3JpcHRpb24uJyksXG59KTtcbmV4cG9ydCB0eXBlIFRyYW5zY3JpYmVQZGZJbnB1dCA9IHouaW5mZXI8dHlwZW9mIFRyYW5zY3JpYmVQZGZJbnB1dFNjaGVtYT47XG5cbmNvbnN0IFRyYW5zY3JpYmVQZGZPdXRwdXRTY2hlbWEgPSB6Lm9iamVjdCh7XG4gIHRleHQ6IHouc3RyaW5nKCkuZGVzY3JpYmUoJ1RoZSB0cmFuc2NyaWJlZCB0ZXh0IGZyb20gdGhlIFBERi4nKSxcbn0pO1xuZXhwb3J0IHR5cGUgVHJhbnNjcmliZVBkZk91dHB1dCA9IHouaW5mZXI8dHlwZW9mIFRyYW5zY3JpYmVQZGZPdXRwdXRTY2hlbWE+O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdHJhbnNjcmliZVBkZihcbiAgaW5wdXQ6IFRyYW5zY3JpYmVQZGZJbnB1dFxuKTogUHJvbWlzZTxUcmFuc2NyaWJlUGRmT3V0cHV0PiB7XG4gIHJldHVybiBwZGZUcmFuc2NyaXB0RmxvdyhpbnB1dCk7XG59XG5cbmNvbnN0IHByb21wdCA9IGFpLmRlZmluZVByb21wdCh7XG4gIG5hbWU6ICdwZGZUcmFuc2NyaXB0UHJvbXB0JyxcbiAgaW5wdXQ6IHtzY2hlbWE6IFRyYW5zY3JpYmVQZGZJbnB1dFNjaGVtYX0sXG4gIG91dHB1dDoge3NjaGVtYTogVHJhbnNjcmliZVBkZk91dHB1dFNjaGVtYX0sXG4gIHByb21wdDogYFlvdSBhcmUgYW4gZXhwZXJ0IGF0IGV4dHJhY3RpbmcgaGlnaC1xdWFsaXR5LCBjbGVhbiB0ZXh0IGZyb20gUERGIGRvY3VtZW50cy5cbllvdXIgcHJpbWFyeSBnb2FsIGlzIHRvIG1haW50YWluIHRoZSBvcmlnaW5hbCBsYXlvdXQgYW5kIHN0cnVjdHVyZSBvZiB0aGUgZG9jdW1lbnQsIGluY2x1ZGluZyBjb2x1bW5zLCB0YWJsZXMsIHBhcmFncmFwaHMsIGFuZCBsaW5lIGJyZWFrcy5cblxuSWYgdGhlIFBERiBjb250YWlucyB0ZXh0IGFycmFuZ2VkIGluIGNvbHVtbnMsIHlvdSBNVVNUIHByZXNlcnZlIHRoaXMgY29sdW1uYXIgc3RydWN0dXJlIGluIHlvdXIgb3V0cHV0LiBVc2UgYXBwcm9wcmlhdGUgc3BhY2luZyBvciBmb3JtYXR0aW5nIHRvIHJlcHJlc2VudCB0aGUgY29sdW1ucyBhcyBhY2N1cmF0ZWx5IGFzIHBvc3NpYmxlLlxuXG5FeHRyYWN0IGFsbCB0aGUgdGV4dCBjb250ZW50IGZyb20gdGhlIHByb3ZpZGVkIFBERiBmaWxlLlxuRG8gbm90IGFkZCBhbnkgY29tbWVudGFyeSBvciBleHRyYSB0ZXh0IHRoYXQgaXMgbm90IGluIHRoZSBvcmlnaW5hbCBQREYuXG5cblBERiBGaWxlOiB7e21lZGlhIHVybD1wZGZEYXRhVXJpfX1gLFxufSk7XG5cbmNvbnN0IHBkZlRyYW5zY3JpcHRGbG93ID0gYWkuZGVmaW5lRmxvdyhcbiAge1xuICAgIG5hbWU6ICdwZGZUcmFuc2NyaXB0RmxvdycsXG4gICAgaW5wdXRTY2hlbWE6IFRyYW5zY3JpYmVQZGZJbnB1dFNjaGVtYSxcbiAgICBvdXRwdXRTY2hlbWE6IFRyYW5zY3JpYmVQZGZPdXRwdXRTY2hlbWEsXG4gIH0sXG4gIGFzeW5jIGlucHV0ID0+IHtcbiAgICBjb25zdCBtb2RlbCA9IGlucHV0Lm1vZGVsID8gZ29vZ2xlQUkubW9kZWwoaW5wdXQubW9kZWwpIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IHtvdXRwdXR9ID0gYXdhaXQgcHJvbXB0KGlucHV0LCB7bW9kZWx9KTtcbiAgICBpZiAoIW91dHB1dCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnUERGIHRvIFRleHQgdHJhbnNjcmlwdGlvbiBmYWlsZWQ6IFRoZSBtb2RlbCBkaWQgbm90IHJldHVybiBhbnkgb3V0cHV0LidcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cbik7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjBTQWdDc0IifQ==
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/ui/label.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Label": (()=>Label)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-label/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
;
;
const labelVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
const Label = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(labelVariants(), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/label.tsx",
        lineNumber: 18,
        columnNumber: 3
    }, this));
_c1 = Label;
Label.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"].displayName;
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Label$React.forwardRef");
__turbopack_context__.k.register(_c1, "Label");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/export.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "exportTranscript": (()=>exportTranscript)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$build$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/docx/build/index.mjs [app-client] (ecmascript)");
;
function formatSrtTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
    const pad = (num)=>num.toString().padStart(2, '0');
    const padMs = (num)=>num.toString().padStart(3, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${padMs(milliseconds)}`;
}
function formatVttTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
    const pad = (num)=>num.toString().padStart(2, '0');
    const padMs = (num)=>num.toString().padStart(3, '0');
    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${padMs(milliseconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}.${padMs(milliseconds)}`;
}
function groupWordsIntoSegments(words, segmentDuration) {
    if (!words.length || segmentDuration <= 0) return [];
    const segments = [];
    let currentSegment = [];
    let segmentStartTime = 0;
    // Use the start time of the first word if available, otherwise 0.
    if (words.length > 0) {
        segmentStartTime = words[0].start;
    }
    for (const word of words){
        // If the current word starts a new segment
        if (word.start >= segmentStartTime + segmentDuration) {
            if (currentSegment.length > 0) {
                const segmentText = currentSegment.map((w)=>w.text).join(' ').trim();
                const segmentEndTime = currentSegment[currentSegment.length - 1].end;
                segments.push({
                    text: segmentText,
                    start: segmentStartTime,
                    end: segmentEndTime
                });
            }
            // Start a new segment
            currentSegment = [
                word
            ];
            segmentStartTime = word.start;
        } else {
            currentSegment.push(word);
        }
    }
    // Add the last remaining segment
    if (currentSegment.length > 0) {
        const segmentText = currentSegment.map((w)=>w.text).join(' ').trim();
        const segmentEndTime = currentSegment[currentSegment.length - 1].end;
        segments.push({
            text: segmentText,
            start: segmentStartTime,
            end: segmentEndTime
        });
    }
    return segments;
}
function exportToSrt(text, words, wordsPerSecond) {
    if (!words || words.length === 0) return null;
    let srtContent = '';
    if (wordsPerSecond && wordsPerSecond > 0) {
        const segments = groupWordsIntoSegments(words, wordsPerSecond);
        segments.forEach((segment, i)=>{
            srtContent += `${i + 1}\n`;
            srtContent += `${formatSrtTime(segment.start)} --> ${formatSrtTime(segment.end)}\n`;
            srtContent += `${segment.text}\n\n`;
        });
    } else {
        words.forEach((word, i)=>{
            srtContent += `${i + 1}\n`;
            srtContent += `${formatSrtTime(word.start)} --> ${formatSrtTime(word.end)}\n`;
            srtContent += `${word.text}\n\n`;
        });
    }
    return srtContent;
}
function exportToVtt(text, words, wordsPerSecond) {
    if (!words || words.length === 0) return null;
    let vttContent = 'WEBVTT\n\n';
    if (wordsPerSecond && wordsPerSecond > 0) {
        const segments = groupWordsIntoSegments(words, wordsPerSecond);
        segments.forEach((segment, i)=>{
            vttContent += `${formatVttTime(segment.start)} --> ${formatVttTime(segment.end)}\n`;
            vttContent += `${segment.text}\n\n`;
        });
    } else {
        words.forEach((word)=>{
            vttContent += `${formatVttTime(word.start)} --> ${formatVttTime(word.end)}\n`;
            vttContent += `${word.text}\n\n`;
        });
    }
    return vttContent;
}
function exportToTxt(text) {
    return text;
}
function exportToJson(words) {
    if (words.length === 0) return null;
    return JSON.stringify(words, null, 2);
}
function exportToCsv(words) {
    if (words.length === 0) return null;
    let csvContent = 'text,start,end\n';
    words.forEach((word)=>{
        const text = `"${word.text.replace(/"/g, '""')}"`;
        csvContent += `${text},${word.start},${word.end}\n`;
    });
    return csvContent;
}
async function exportToDocx(text) {
    const doc = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$build$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Document"]({
        sections: [
            {
                properties: {},
                children: [
                    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$build$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Paragraph"]({
                        children: text.split('\n').map((line)=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$build$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextRun"](line))
                    })
                ]
            }
        ]
    });
    return await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$build$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Packer"].toBlob(doc);
}
function downloadFile(content, filename, mimeType) {
    const blob = content instanceof Blob ? content : new Blob([
        content
    ], {
        type: mimeType
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
async function exportTranscript(text, format, words, showToast, wordsPerSecond) {
    if (!text.trim() && format !== 'json' && format !== 'csv') {
        showToast({
            title: "Export Failed",
            description: "There is no text to export.",
            variant: "destructive"
        });
        return;
    }
    let content = null;
    let filename = 'transcript';
    let mimeType = 'text/plain';
    switch(format){
        case 'srt':
            content = exportToSrt(text, words, wordsPerSecond);
            filename += '.srt';
            if (!content) {
                showToast({
                    title: "Export Failed",
                    description: "Word timings not available for SRT export. Try using the 'Words per second' setting.",
                    variant: "destructive"
                });
                return;
            }
            break;
        case 'vtt':
            content = exportToVtt(text, words, wordsPerSecond);
            filename += '.vtt';
            mimeType = 'text/vtt';
            if (!content) {
                showToast({
                    title: "Export Failed",
                    description: "Word timings not available for VTT export. Try using the 'Words per second' setting.",
                    variant: "destructive"
                });
                return;
            }
            break;
        case 'txt':
            content = exportToTxt(text);
            filename += '.txt';
            break;
        case 'json':
            content = exportToJson(words);
            filename += '.json';
            mimeType = 'application/json';
            if (!content) {
                showToast({
                    title: "Export Failed",
                    description: "No structured transcript available for JSON export.",
                    variant: "destructive"
                });
                return;
            }
            break;
        case 'csv':
            content = exportToCsv(words);
            filename += '.csv';
            mimeType = 'text/csv';
            if (!content) {
                showToast({
                    title: "Export Failed",
                    description: "No structured transcript available for CSV export.",
                    variant: "destructive"
                });
                return;
            }
            break;
        case 'docx':
            content = await exportToDocx(text);
            filename += '.docx';
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
        default:
            showToast({
                title: "Export Failed",
                description: "Unsupported export format.",
                variant: "destructive"
            });
            return;
    }
    downloadFile(content, filename, mimeType);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "PdfTranscriptPage": (()=>PdfTranscriptPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-up.js [app-client] (ecmascript) <export default as FileUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/download.js [app-client] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/copy.js [app-client] (ecmascript) <export default as Copy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-toast.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/textarea.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$ai$2f$flows$2f$data$3a$ffcb5a__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/ai/flows/data:ffcb5a [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/sheet.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/select.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/label.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$export$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/export.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/translations.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$layouts$2f$feature$2d$page$2d$layout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/layouts/feature-page-layout.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$language$2d$context$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/language-context.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const blobToBase64 = (blob)=>{
    return new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onloadend = ()=>{
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert blob to Base64.'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
function PdfTranscriptPage() {
    _s();
    const [pdfFile, setPdfFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isTranscribing, setIsTranscribing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [transcribedText, setTranscribedText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [isDragging, setIsDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isExportSheetOpen, setIsExportSheetOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [exportFormat, setExportFormat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('docx');
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const langContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$language$2d$context$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LanguageContext"]);
    if (!langContext) {
        throw new Error('PdfTranscriptPage must be used within a LanguageProvider');
    }
    const { language } = langContext;
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "PdfTranscriptPage.useMemo[t]": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allTranslations"][language]
    }["PdfTranscriptPage.useMemo[t]"], [
        language
    ]);
    const modelContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$layouts$2f$feature$2d$page$2d$layout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModelContext"]);
    if (!modelContext) {
        throw new Error('PdfTranscriptPage must be used within a ModelProvider');
    }
    const { selectedModel } = modelContext;
    const resetState = ()=>{
        setPdfFile(null);
        setTranscribedText('');
    };
    const handleFileSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "PdfTranscriptPage.useCallback[handleFileSelect]": async (file)=>{
            if (!file) return;
            if (file.type !== 'application/pdf') {
                toast({
                    title: t.invalidFileType,
                    description: t.selectPdfFile,
                    variant: "destructive"
                });
                return;
            }
            resetState();
            setPdfFile(file);
            setIsTranscribing(true);
            try {
                const pdfDataUri = await blobToBase64(file);
                const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$ai$2f$flows$2f$data$3a$ffcb5a__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["transcribePdf"])({
                    pdfDataUri,
                    model: selectedModel
                });
                if (result && result.text) {
                    setTranscribedText(result.text);
                } else {
                    toast({
                        title: t.transcriptionFailed,
                        description: t.noText,
                        variant: "destructive"
                    });
                }
            } catch (e) {
                console.error(e);
                let title = t.transcriptionError;
                let description = e.message || "An error occurred while processing your PDF.";
                const errorMessage = (e.message || '').toLowerCase();
                if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
                    title = t.rateLimitExceeded;
                    description = t.rateLimitMessage;
                }
                toast({
                    title: title,
                    description: description,
                    variant: "destructive"
                });
            } finally{
                setIsTranscribing(false);
            }
        }
    }["PdfTranscriptPage.useCallback[handleFileSelect]"], [
        t,
        toast,
        selectedModel
    ]);
    const handleDragEvents = (e)=>{
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDragEnter = (e)=>{
        handleDragEvents(e);
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };
    const handleDragLeave = (e)=>{
        handleDragEvents(e);
        setIsDragging(false);
    };
    const handleDrop = (e)=>{
        handleDragEvents(e);
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files?.[0]);
    };
    const handleExport = ()=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$export$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["exportTranscript"])(transcribedText, exportFormat, [], toast);
        setIsExportSheetOpen(false);
    };
    const formatDisplayNames = {
        docx: 'DOCX (Word Document)',
        txt: 'TXT (Plain Text)',
        json: 'JSON (Structured Data)',
        csv: 'CSV (Spreadsheet)'
    };
    const handleCopy = ()=>{
        if (!transcribedText) return;
        navigator.clipboard.writeText(transcribedText).then(()=>{
            toast({
                title: t.copied
            });
        });
    };
    const isReadyForContent = !isTranscribing && transcribedText.length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-full bg-background text-foreground",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "flex-grow p-4 md:p-6 grid grid-cols-1 gap-6 relative overflow-y-auto",
                onDragEnter: handleDragEnter,
                onDragOver: handleDragEvents,
                onDragLeave: handleDragLeave,
                onDrop: handleDrop,
                children: [
                    isTranscribing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                className: "h-12 w-12 animate-spin text-primary"
                            }, void 0, false, {
                                fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                lineNumber: 168,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-muted-foreground mt-4 text-lg",
                                children: t.transcribing
                            }, void 0, false, {
                                fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                lineNumber: 169,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                        lineNumber: 167,
                        columnNumber: 17
                    }, this),
                    !pdfFile ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-card h-full transition-colors cursor-pointer", isDragging && "border-primary bg-primary/10"),
                        onClick: ()=>fileInputRef.current?.click(),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileUp$3e$__["FileUp"], {
                                className: "w-16 h-16 text-muted-foreground/30 mb-4"
                            }, void 0, false, {
                                fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                lineNumber: 181,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-xl font-semibold",
                                children: t.readyToTranscribe
                            }, void 0, false, {
                                fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                lineNumber: 182,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-muted-foreground mt-2",
                                children: t.dropPdf
                            }, void 0, false, {
                                fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                lineNumber: 183,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                        lineNumber: 174,
                        columnNumber: 17
                    }, this) : isReadyForContent && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                        className: "flex flex-col h-full shadow-sm overflow-hidden rounded-2xl",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Textarea"], {
                            value: transcribedText,
                            readOnly: true,
                            placeholder: t.transcribedTextPlaceholder,
                            className: "h-full w-full resize-none font-body text-base leading-relaxed p-6 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-grow",
                            "aria-label": "Transcribed Text"
                        }, void 0, false, {
                            fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                            lineNumber: 188,
                            columnNumber: 23
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                        lineNumber: 187,
                        columnNumber: 19
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "file",
                        ref: fileInputRef,
                        onChange: (e)=>handleFileSelect(e.target.files?.[0]),
                        className: "hidden",
                        accept: "application/pdf"
                    }, void 0, false, {
                        fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                        lineNumber: 199,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                lineNumber: 159,
                columnNumber: 9
            }, this),
            isReadyForContent && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full max-w-lg flex gap-2 items-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            onClick: handleCopy,
                            variant: "outline",
                            size: "icon",
                            className: "h-12 w-12 rounded-full",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__["Copy"], {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                    lineNumber: 212,
                                    columnNumber: 23
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "sr-only",
                                    children: t.copy
                                }, void 0, false, {
                                    fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                    lineNumber: 213,
                                    columnNumber: 23
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                            lineNumber: 211,
                            columnNumber: 19
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sheet"], {
                            open: isExportSheetOpen,
                            onOpenChange: setIsExportSheetOpen,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetTrigger"], {
                                    asChild: true,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        size: "lg",
                                        className: "flex-1 rounded-full h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                                className: "h-5 w-5"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                lineNumber: 218,
                                                columnNumber: 31
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "ml-2 sm:inline font-bold",
                                                children: t.download
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                lineNumber: 219,
                                                columnNumber: 31
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                        lineNumber: 217,
                                        columnNumber: 27
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                    lineNumber: 216,
                                    columnNumber: 23
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetContent"], {
                                    side: "bottom",
                                    className: "rounded-t-lg",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetHeader"], {
                                            className: "text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetTitle"], {
                                                    children: t.exportSettings
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                    lineNumber: 224,
                                                    columnNumber: 31
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetDescription"], {
                                                    children: t.chooseFormat
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                    lineNumber: 225,
                                                    columnNumber: 31
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                            lineNumber: 223,
                                            columnNumber: 27
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid gap-6 py-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                                            children: t.exportFormat
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                            lineNumber: 231,
                                                            columnNumber: 35
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                                                            value: exportFormat,
                                                            onValueChange: setExportFormat,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectTrigger"], {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectValue"], {
                                                                        placeholder: "Select format"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                                        lineNumber: 234,
                                                                        columnNumber: 43
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                                    lineNumber: 233,
                                                                    columnNumber: 39
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectContent"], {
                                                                    children: Object.entries(formatDisplayNames).map(([value, label])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectItem"], {
                                                                            value: value,
                                                                            children: label
                                                                        }, value, false, {
                                                                            fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                                            lineNumber: 238,
                                                                            columnNumber: 43
                                                                        }, this))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                                    lineNumber: 236,
                                                                    columnNumber: 39
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                            lineNumber: 232,
                                                            columnNumber: 35
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                    lineNumber: 230,
                                                    columnNumber: 27
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                    onClick: handleExport,
                                                    size: "lg",
                                                    className: "bg-accent text-accent-foreground hover:bg-accent/90",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                                            className: "mr-2"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                            lineNumber: 248,
                                                            columnNumber: 35
                                                        }, this),
                                                        t.exportTranscript
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                                    lineNumber: 243,
                                                    columnNumber: 31
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                            lineNumber: 229,
                                            columnNumber: 27
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                                    lineNumber: 222,
                                    columnNumber: 23
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                            lineNumber: 215,
                            columnNumber: 19
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                    lineNumber: 210,
                    columnNumber: 15
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
                lineNumber: 209,
                columnNumber: 11
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx",
        lineNumber: 158,
        columnNumber: 5
    }, this);
}
_s(PdfTranscriptPage, "EA8IrL0Q2kXszhHOWAPkWuzpw7U=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = PdfTranscriptPage;
var _c;
__turbopack_context__.k.register(_c, "PdfTranscriptPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/pdf-transcript/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>PdfTranscript)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$transcript$2d$pdf$2f$components$2f$pdf$2d$transcript$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/transcript-pdf/components/pdf-transcript-page.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$layouts$2f$feature$2d$page$2d$layout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/layouts/feature-page-layout.tsx [app-client] (ecmascript)");
"use client";
;
;
;
function PdfTranscript() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$layouts$2f$feature$2d$page$2d$layout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FeaturePageLayout"], {
        title: "PDF Transcript",
        showModelSelector: true,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$transcript$2d$pdf$2f$components$2f$pdf$2d$transcript$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PdfTranscriptPage"], {}, void 0, false, {
            fileName: "[project]/src/app/pdf-transcript/page.tsx",
            lineNumber: 10,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/pdf-transcript/page.tsx",
        lineNumber: 9,
        columnNumber: 7
    }, this);
}
_c = PdfTranscript;
var _c;
__turbopack_context__.k.register(_c, "PdfTranscript");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_66a25f75._.js.map