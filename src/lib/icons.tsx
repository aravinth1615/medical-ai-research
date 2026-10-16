"use client";

import * as React from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Activity01Icon,
  Add01Icon,
  AddCircleIcon,
  AiBrain01Icon,
  AlertCircleIcon,
  ArrowDownRight01Icon,
  ArrowLeftRightIcon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Attachment01Icon,
  BarChartIcon,
  BellIcon,
  BookOpen01Icon,
  Calendar03Icon,
  Cancel01Icon,
  CheckIcon,
  CheckmarkCircle02Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  Clock01Icon,
  CommandIcon,
  CommandLineIcon,
  DnaIcon,
  DropletIcon,
  EyeIcon,
  EyeOffIcon,
  FavouriteIcon,
  File01Icon,
  Fire02Icon,
  FlashIcon,
  FlaskConicalIcon,
  FootprintsIcon,
  Home01Icon,
  InformationCircleIcon,
  Layers01Icon,
  Leaf01Icon,
  Loading03Icon,
  LockIcon,
  Logout01Icon,
  Mail01Icon,
  Medicine02Icon,
  Moon02Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  PieChartIcon,
  RefreshIcon,
  SaveIcon,
  Search01Icon,
  SecurityCheckIcon,
  SentIcon,
  SmartWatch01Icon,
  SparklesIcon,
  StethoscopeIcon,
  TaskDone01Icon,
  TestTube01Icon,
  Wifi01Icon,
  /* Research module. */
  Alert02Icon,
  ArrowExpand01Icon,
  ArrowLeft01Icon,
  ArrowShrink01Icon,
  Copy01Icon,
  CpuIcon,
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  FilterIcon,
  Folder01Icon,
  FolderAddIcon,
  FolderOpenIcon,
  GlobeIcon,
  HashIcon,
  Image01Icon,
  LayoutGridIcon,
  LayoutTwoColumnIcon,
  LibraryIcon,
  Link01Icon,
  LinkSquare02Icon,
  MagicWand01Icon,
  MinusSignIcon,
  MoreHorizontalIcon,
  Note01Icon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  RssIcon,
  Shield01Icon,
  SlidersHorizontalIcon,
  SourceCodeIcon,
  StopIcon,
  Tag01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";

/**
 * Hugeicons — the one icon set in the project — exposed under readable names.
 * Size comes from a `size-*` class: CSS width/height beat the attributes
 * HugeiconsIcon writes.
 */
export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "ref"> {
  size?: number | string;
  strokeWidth?: number;
}

export type IconComponent = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

function icon(glyph: IconSvgElement, displayName: string): IconComponent {
  const Comp = React.forwardRef<SVGSVGElement, IconProps>(
    ({ strokeWidth = 1.8, size = 24, ...props }, ref) => (
      <HugeiconsIcon ref={ref} icon={glyph} size={size} strokeWidth={strokeWidth} aria-hidden {...props} />
    )
  );
  Comp.displayName = displayName;
  return Comp;
}

/* ---- Chrome --------------------------------------------------------------- */
export const Home = icon(Home01Icon, "Home");
export const PieChart = icon(PieChartIcon, "PieChart");
export const FileText = icon(File01Icon, "FileText");
export const PanelLeftClose = icon(PanelLeftCloseIcon, "PanelLeftClose");
export const PanelLeftOpen = icon(PanelLeftOpenIcon, "PanelLeftOpen");
export const PanelRightClose = icon(PanelRightCloseIcon, "PanelRightClose");
export const PanelRightOpen = icon(PanelRightOpenIcon, "PanelRightOpen");
export const Search = icon(Search01Icon, "Search");
export const Command = icon(CommandIcon, "Command");
export const Bell = icon(BellIcon, "Bell");
export const LogOut = icon(Logout01Icon, "LogOut");

/* ---- Clinical ------------------------------------------------------------- */
export const Flask = icon(FlaskConicalIcon, "Flask");
export const TestTube = icon(TestTube01Icon, "TestTube");
export const Pill = icon(Medicine02Icon, "Pill");
export const Leaf = icon(Leaf01Icon, "Leaf");
export const Wifi = icon(Wifi01Icon, "Wifi");
export const Watch = icon(SmartWatch01Icon, "Watch");
export const Flame = icon(Fire02Icon, "Flame");
export const Stethoscope = icon(StethoscopeIcon, "Stethoscope");
export const Heart = icon(FavouriteIcon, "Heart");
export const Dna = icon(DnaIcon, "Dna");
export const Droplet = icon(DropletIcon, "Droplet");
export const Activity = icon(Activity01Icon, "Activity");
export const Moon = icon(Moon02Icon, "Moon");
export const Footprints = icon(FootprintsIcon, "Footprints");
export const Brain = icon(AiBrain01Icon, "Brain");

/* ---- Actions -------------------------------------------------------------- */
export const Plus = icon(Add01Icon, "Plus");
export const PlusCircle = icon(AddCircleIcon, "PlusCircle");
export const X = icon(Cancel01Icon, "X");
export const Check = icon(CheckIcon, "Check");
export const Paperclip = icon(Attachment01Icon, "Paperclip");
export const Send = icon(SentIcon, "Send");
export const Save = icon(SaveIcon, "Save");
export const Refresh = icon(RefreshIcon, "Refresh");
export const ArrowLeftRight = icon(ArrowLeftRightIcon, "ArrowLeftRight");
export const Mail = icon(Mail01Icon, "Mail");
export const Lock = icon(LockIcon, "Lock");
export const Eye = icon(EyeIcon, "Eye");
export const EyeOff = icon(EyeOffIcon, "EyeOff");

/* ---- Content & status ------------------------------------------------------ */
export const BookOpen = icon(BookOpen01Icon, "BookOpen");
export const Layers = icon(Layers01Icon, "Layers");
export const Sparkles = icon(SparklesIcon, "Sparkles");
export const Terminal = icon(CommandLineIcon, "Terminal");
export const Zap = icon(FlashIcon, "Zap");
export const BarChart = icon(BarChartIcon, "BarChart");
export const Calendar = icon(Calendar03Icon, "Calendar");
export const Clock = icon(Clock01Icon, "Clock");
export const ShieldCheck = icon(SecurityCheckIcon, "ShieldCheck");
export const TaskDone = icon(TaskDone01Icon, "TaskDone");
export const Info = icon(InformationCircleIcon, "Info");
export const CircleAlert = icon(AlertCircleIcon, "CircleAlert");
export const CircleCheck = icon(CheckmarkCircle02Icon, "CircleCheck");

/* ---- Directional ---------------------------------------------------------- */
export const ArrowRight = icon(ArrowRight01Icon, "ArrowRight");
export const ArrowUpRight = icon(ArrowUpRight01Icon, "ArrowUpRight");
export const ArrowDownRight = icon(ArrowDownRight01Icon, "ArrowDownRight");
export const ChevronDown = icon(ChevronDownIcon, "ChevronDown");
export const ChevronUp = icon(ChevronUpIcon, "ChevronUp");
export const ChevronRight = icon(ChevronRightIcon, "ChevronRight");

/* ---- Research module ------------------------------------------------------ */
export const AlertTriangle = icon(Alert02Icon, "AlertTriangle");
export const Maximize = icon(ArrowExpand01Icon, "Maximize");
export const Minimize = icon(ArrowShrink01Icon, "Minimize");
export const ArrowLeft = icon(ArrowLeft01Icon, "ArrowLeft");
export const Copy = icon(Copy01Icon, "Copy");
export const Cpu = icon(CpuIcon, "Cpu");
export const Trash = icon(Delete02Icon, "Trash");
export const Download = icon(Download01Icon, "Download");
export const Upload = icon(Upload01Icon, "Upload");
export const Pencil = icon(Edit02Icon, "Pencil");
export const Filter = icon(FilterIcon, "Filter");
export const Folder = icon(Folder01Icon, "Folder");
export const FolderPlus = icon(FolderAddIcon, "FolderPlus");
export const FolderOpen = icon(FolderOpenIcon, "FolderOpen");
export const Globe = icon(GlobeIcon, "Globe");
export const Hash = icon(HashIcon, "Hash");
export const ImageIcon = icon(Image01Icon, "ImageIcon");
export const Grid = icon(LayoutGridIcon, "Grid");
export const Columns = icon(LayoutTwoColumnIcon, "Columns");
export const Library = icon(LibraryIcon, "Library");
export const LinkIcon = icon(Link01Icon, "LinkIcon");
export const ExternalLink = icon(LinkSquare02Icon, "ExternalLink");
export const Wand = icon(MagicWand01Icon, "Wand");
export const Minus = icon(MinusSignIcon, "Minus");
export const MoreHorizontal = icon(MoreHorizontalIcon, "MoreHorizontal");
export const Note = icon(Note01Icon, "Note");
export const Pause = icon(PauseIcon, "Pause");
export const Play = icon(PlayIcon, "Play");
export const Repeat = icon(RepeatIcon, "Repeat");
export const Rss = icon(RssIcon, "Rss");
export const Shield = icon(Shield01Icon, "Shield");
export const Sliders = icon(SlidersHorizontalIcon, "Sliders");
export const Code = icon(SourceCodeIcon, "Code");
export const Stop = icon(StopIcon, "Stop");
export const Tag = icon(Tag01Icon, "Tag");

/** Spinner — pair with `animate-spin`. */
export const Loader = icon(Loading03Icon, "Loader");
