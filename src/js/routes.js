import BlankPage from '../pages/blank.f7.html';
import WelcomePage from '../pages/welcome.f7.html';
import LoginPage from '../pages/login.f7.html';
import RegisterPage from '../pages/register.f7.html';
import AboutPage from '../pages/about.f7.html';
import NoticesPage from '../pages/notices.f7.html';
import EditNoticePage from '../pages/add-notice.f7.html';
import ComplaintsPage from '../pages/complaints.f7.html';
import InformationPage from '../pages/information.f7.html';
import DirectoryPage from '../pages/directory.f7.html';
import WorkersPage from '../pages/workers.f7.html';
import ExpensesPage from '../pages/expenses.f7.html';
import EditExpensePage from '../pages/edit-expense.f7.html';
import AddCollectionPage from '../pages/add-collection.f7.html';
import AddMaintenancePage from '../pages/add-maintenance.f7.html';
import ExpenseDetailsPage from '../pages/expense-details.f7.html';
import ComplaintDetailsPage from '../pages/complaint.f7.html';
import MyComplainsPage from '../pages/my-complains.f7.html';
import ComplaintReplyPage from '../pages/complaint-reply.f7.html';
import AddComplaintPage from '../pages/add-complaint.f7.html';
import EditContactPage from '../pages/edit-contact.f7.html';
import EditWorkerPage from '../pages/edit-worker.f7.html';
import MyProfilePage from '../pages/my-profile.f7.html';
import AddPollPage from '../pages/add-poll.f7.html';
import AddVotePage from '../pages/poll-vote.f7.html';
import GuidelinesPage from '../pages/guidelines.f7.html';
import ViewGuidelinePage from '../pages/guideline-details.f7.html';
import DueDatesPage from '../pages/due-dates.f7.html';
import WorkersLeavesPage from '../pages/workers-leaves.f7.html';
import AddWorkerLeavePage from '../pages/add-worker-leave.f7.html';
import NotFoundPage from '../pages/404.f7.html';

var routes = [
  {
    path: '/',
    component: WelcomePage,
  },
  {
    path: '/blank/',
    component: BlankPage,
  },
	{
    path: '/login/',
    component: LoginPage,
  },
	{
    path: '/register/',
    component: RegisterPage,
  },
  {
    path: '/notices/',
    component: NoticesPage,
  },
  {
    path: '/add-notice/',
    component: EditNoticePage,
  },
  {
    path: '/edit-notice/:id',
    component: EditNoticePage,
  },
  {
    path: '/complaints/',
    component: ComplaintsPage,
  },
  {
    path: '/information/',
    component: InformationPage,
  },
  {
    path: '/directory/',
    component: DirectoryPage,
  },
  {
    path: '/workers/',
    component: WorkersPage,
  },
  {
    path: '/expenses/',
    component: ExpensesPage,
  },
  {
    path: '/expenses/:month',
    component: ExpenseDetailsPage,
  },
  {
    path: '/add-expense/',
    component: EditExpensePage,
  },
  {
    path: '/edit-expense/',
    component: EditExpensePage,
  },
  {
    path: '/add-collection/',
    component: AddCollectionPage,
  },
  {
    path: '/add-maintenance/',
    component: AddMaintenancePage,
  },
  {
    path: '/complaint/:id',
    component: ComplaintDetailsPage,
  },
  {
    path: '/my-complains/',
    component: MyComplainsPage,
  },
  {
    path: '/add-complaint/',
    component: AddComplaintPage,
  },
  {
    path: '/complaint-reply/:id/:status',
    component: ComplaintReplyPage,
  },
  {
    path: '/edit-contact/:id',
    component: EditContactPage,
  },
  {
    path: '/add-worker/',
    component: EditWorkerPage,
  },
  {
    path: '/edit-worker/:id',
    component: EditWorkerPage,
  },
  {
    path: '/my-profile/',
    component: MyProfilePage,
  },
  {
    path: '/add-poll/',
    component: AddPollPage,
  },
  {
    path: '/poll-vote/:id',
    component: AddVotePage,
  },
  {
    path: '/due-dates/',
    component: DueDatesPage,
  },
  {
    path: '/about/',
    component: AboutPage,
  },
  {
    path: '/guidelines/',
    component: GuidelinesPage,
  },
  {
    path: '/guidelines/:id',
    component: ViewGuidelinePage,
  },
  {
    path: '/workers-leaves',
    component: WorkersLeavesPage
  },
  {
    path: '/add-worker-leave',
    component: AddWorkerLeavePage
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;
