import { getReviews, Review } from "@/app/actions/review";
import ReviewManagement from "@/component/reviewManagement/ReviewManagement";

const ReviewsPage = async () => {
  const response = await getReviews(1, 20);

  const initialReviews = (response.success && response.data ? response.data : []) as Review[];
  const pagination = response.pagination;

  return <ReviewManagement initialReviews={initialReviews} pagination={pagination} />;
};

export default ReviewsPage;