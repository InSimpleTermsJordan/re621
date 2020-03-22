import { TagTypes, Tag } from "./Tag";

/**
 * Collects basic info for a post.
 * Constructable via getVisiblePosts or getViewingPost
 */
export class Post {

    private static posts: Post[];

    protected element: JQuery<HTMLElement>;

    protected id: number;
    protected tags: string;
    protected rating: string;
    protected favorites: number;
    protected score: number;

    protected fileURL: string;
    protected sampleURL: string;
    protected previewURL: string;
    protected fileExtension: string;

    protected uploaderID: number;
    protected uploaderName: string;

    protected sound: boolean;
    protected flags: string;

    protected constructor($image: JQuery<HTMLElement>) {
        this.id = parseInt($image.attr("data-id"));
        this.tags = $image.attr("data-tags");
        this.rating = PostRating[$image.attr("data-rating")];

        if ($image.attr("data-fav-count")) { this.favorites = parseInt($image.attr("data-fav-count")); }
        else { parseInt($image.find(".post-score-faves").first().html().substring(1)); }

        if ($image.attr("data-score")) { this.score = parseInt($image.attr("data-score")); }
        else { parseInt($image.find(".post-score-score").first().html().substring(1)); }

        this.fileURL = $image.attr("data-file-url");
        this.sampleURL = $image.attr("data-large-file-url");
        this.previewURL = $image.attr("data-preview-file-url");
        this.fileExtension = $image.attr("data-file-ext");

        this.uploaderID = parseInt($image.attr("data-uploader-id"));
        this.uploaderName = $image.attr("data-uploader-id");

        this.sound = $image.attr("data-has-sound") === "true";
        this.flags = $image.attr("data-flags");

        this.element = $image;
    }

    /**
     * Fetches the posts from the current page.
     * @param cached If true, re-parses the page for data
     */
    public static fetchPosts(cached: boolean = true) {
        if (this.posts !== undefined && cached) return this.posts;

        let imageContainer = $("#image-container");
        this.posts = [];
        if (imageContainer.length === 0) {
            $("#posts-container").children(".post-preview").each(function () {
                Post.posts.push(new Post($(this)));
            });
        } else {
            this.posts.push(new ViewingPost(imageContainer));
        }
        return this.posts;
    }

    /**
     * Forces the function fetchPosts to reaquire it's info
     * This is useful if posts have been appended
     */
    public static invalidatePostsCache() {
        this.posts = undefined;
    }

    /**
     * Fetches all posts if you are on https://e621.net/posts or similar
     * @deprecated Use fetchPosts() instead
     * @returns Post[] List of posts
     */
    public static getVisiblePosts() {
        return this.fetchPosts();
    }

    /**
     * Creates a ViewingPost if you are on a post page (https://e621.net/posts/:id)
     * @deprecated Use fetchPosts() instead
     * @returns Post the current post if it exists, undefined otherwise
     */
    public static getViewingPost() {
        if ($("#image-container").length === 0) { return undefined; }
        return <ViewingPost>this.fetchPosts()[0];
    }

    /**
    * Checks if the post would be returned if you searched on the site with filterString
    * Most of the things that work on the site should also work here
    * @todo Implement ~ modifier
    */
    public tagsMatchesFilter(queryString: string) {
        const seperatedFilters = queryString.split(" ");
        let result = true;
        for (const filter of seperatedFilters) {
            const inverse = filter.startsWith("-");
            //Remove dash from filter, if it starts with one
            const filterNoMinus = inverse ? filter.substring(1) : filter;
            //If the result is already negative, bail. All filters must match
            if (result === false) {
                break;
            }
            if (filterNoMinus.includes("*")) {
                const regex = Tag.escapeSearchToRegex(filterNoMinus);
                result = regex.test(this.getTags());
            } else {
                //if there is no wildcard, the filter and tag must be an equal match
                let matchFound = false;
                for (const tag of this.getTags().split(" ")) {
                    if (tag === filterNoMinus) {
                        matchFound = true;
                        break;
                    }
                }
                result = matchFound;
            }
            //invert the result, depending on if the filter started with a -
            result = result !== inverse;
        }
        return result;
    }

    /**
     * Returns true if the post has been hidden by InstantSearch
     * @returns boolean True if the post has been hidden, false otherwise
     */
    public isVisible() { return !this.element.hasClass("filtered"); }

    /**
     * Sets the post's visibility status
     * @param hidden If true, hides the post, if false shows it
     */
    public setVisibility(visible = true) {
        if (visible) { this.element.removeClass("filtered"); }
        else { this.element.addClass("filtered"); }
    }

    /**
     * Returns the JQuery Object for the post
     * @returns JQuery<HTMLElement> DOM Element
     */
    public getDomElement() {
        return this.element;
    }

    public getId() { return this.id; }
    public getTags() { return this.tags; }
    public getRating() { return this.rating; }
    public getFavCount() { return this.favorites; }
    public getScoreCount() { return this.score; }

    public getImageURL() { return this.fileURL; }
    public getSampleURL() { return this.sampleURL; }
    public getPreviewURL() { return this.previewURL; }

    public getFileExtension() { return this.fileExtension; }

    public getUploaderID() { return this.uploaderID; }
    public getUploaderName() { return this.uploaderName; }

    public hasSound() { return this.sound; }
    public getFlags() { return this.flags; }
}


/**
 * If you are viewing a post this element can be constructed
 */
export class ViewingPost extends Post {
    private isFaved: boolean;
    private isUpvoted: boolean;
    private isDownvoted: boolean;

    private artistTags: string[];
    private characterTags: string[];
    private copyrightTags: string[];
    private speciesTags: string[];
    private generalTags: string[];
    private metaTags: string[];
    private loreTags: string[];

    constructor($image: JQuery<HTMLElement>) {
        super($image);

        this.isFaved = $("#add-to-favorites").css("display") === "none";
        this.isUpvoted = $("#post-vote-up-" + this.id).hasClass("score-positive");
        this.isDownvoted = $("#post-vote-down-" + this.id).hasClass("score-negative");

        this.artistTags = this.getAllFromTaggroup("artist");
        this.characterTags = this.getAllFromTaggroup("character");
        this.copyrightTags = this.getAllFromTaggroup("copyright");
        this.speciesTags = this.getAllFromTaggroup("species");
        this.generalTags = this.getAllFromTaggroup("general");
        this.metaTags = this.getAllFromTaggroup("meta");
        this.loreTags = this.getAllFromTaggroup("lore");
    }

    private getAllFromTaggroup(taggroup: string) {
        const result = [];
        for (const element of $(`#tag-list .${taggroup}-tag-list`).children()) {
            result.push($(element).find(".search-tag").text().replace(/ /g, "_"));
        }
        return result;
    }
    /**
     * Returns true if the post is favorited
     */
    public getIsFaved() {
        return this.isFaved;
    }

    /**
     * Returns true if the post is upvoted
     */
    public getIsUpvoted() {
        return this.isUpvoted;
    }

    /**
     * Returns true if the post is downvoted
     */
    public getIsDownvoted() {
        return this.isDownvoted;
    }

    /**
     * Returns an array of all the tags of the specified type, or an empty array if there are none
     */
    public getTagsFromType(tagType: TagTypes): string[] {
        return this[tagType + "Tags"];
    }
}

export enum PostRating {
    Safe = "s",
    Questionable = "q",
    Explicit = "e",
}
