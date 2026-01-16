"use client";
import {
  deleteReview,
  getReviews,
  replyToReview,
  Review,
  updateReviewStatus,
} from "@/app/actions/review";
import { useSidebar } from "@/lib/SidebarContext";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaCheck,
  FaComment,
  FaReply,
  FaStar,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

interface ReviewManagementProps {
  initialReviews: Review[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const ReviewManagement = ({
  initialReviews,
  pagination: initialPagination,
}: ReviewManagementProps) => {
  const { isDarkMode } = useSidebar();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleFilterChange = async (status: string) => {
    setStatusFilter(status);
    setLoading(true);
    const filter = status === "all" ? "" : status;
    const response = await getReviews(1, 20, filter);
    if (response.success && response.data) {
      setReviews(response.data as Review[]);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const response = await updateReviewStatus(id, newStatus);
    if (response.success) {
      toast.success(`Review ${newStatus}`);
      setReviews(
        reviews.map((r) =>
          r._id === id ? { ...r, status: newStatus as any } : r
        )
      );
    } else {
      toast.error(response.error || "Failed to update review");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      const response = await deleteReview(id);
      if (response.success) {
        toast.success("Review deleted");
        setReviews(reviews.filter((r) => r._id !== id));
      } else {
        toast.error(response.error || "Failed to delete review");
      }
    }
  };

  const handleReplySubmit = async (id: string) => {
    if (!replyText.trim()) return;
    const response = await replyToReview(id, replyText);
    if (response.success) {
      toast.success("Reply added");
      setReplyId(null);
      setReplyText("");
      // Ideally refresh or update local state with reply
      // For now, close input
    } else {
      toast.error(response.error || "Failed to reply");
    }
  };

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Reviews</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Manage product reviews and ratings
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {["all", "pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => handleFilterChange(status)}
            className={`px-4 py-2 rounded-lg capitalize ${
              statusFilter === status
                ? "bg-blue-600 text-white"
                : isDarkMode
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-white text-gray-600 hover:bg-gray-50 border"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8">Loading...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No reviews found.
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className={`p-6 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {review.product?.images?.[0]?.url && (
                        <img
                        src={review.product.images[0].url}
                        alt={review.product.name}
                        className="w-full h-full object-cover"
                        />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {review.product?.name || "Unknown Product"}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex text-yellow-400 text-sm">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={
                              i < review.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        by {review.customerName}
                      </span>
                    </div>
                    <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {review.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(review._id, "approved")}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Approve"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(review._id, "rejected")}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Reject"
                      >
                        <FaTimes />
                      </button>
                    </>
                  )}
                  {review.status !== "pending" && (
                      <span className={`px-2 py-1 text-xs rounded-full capitalize border ${
                          review.status === 'approved' 
                            ? (isDarkMode ? "bg-green-900/20 text-green-400 border-green-800" : "bg-green-50 text-green-700 border-green-200")
                            : (isDarkMode ? "bg-red-900/20 text-red-400 border-red-800" : "bg-red-50 text-red-700 border-red-200")
                      }`}>
                          {review.status}
                      </span>
                  )}
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                {review.title && (
                    <h4 className="font-medium mb-1">{review.title}</h4>
                )}
                <p className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {review.comment}
                </p>
              </div>

              {/* Reply Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {review.response ? (
                      <div className={`p-3 rounded-lg text-sm ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                          <p className="font-semibold mb-1 text-xs text-blue-500">Response:</p>
                          <p>{review.response.text}</p>
                      </div>
                  ) : (
                      <div>
                          {replyId === review._id ? (
                              <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write a reply..."
                                    className={`flex-1 px-3 py-2 rounded border text-sm ${
                                        isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300"
                                    }`}
                                  />
                                  <button onClick={() => handleReplySubmit(review._id)} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Reply</button>
                                  <button onClick={() => setReplyId(null)} className="px-3 py-2 border rounded text-sm">Cancel</button>
                              </div>
                          ) : (
                              <button onClick={() => setReplyId(review._id)} className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                                  <FaReply/> Reply
                              </button>
                          )}
                      </div>
                  )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewManagement;
